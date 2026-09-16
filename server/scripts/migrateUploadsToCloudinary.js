/**
 * uploads/ altındaki tüm dosyaları Cloudinary'ye yükler;
 * DB'deki /uploads/... referanslarını secure_url ile değiştirir.
 *
 * Kullanım: node scripts/migrateUploadsToCloudinary.js
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const { uploadRoot } = require('../utils/uploadStore');

const cloudName = () => String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = () => String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = () => String(process.env.CLOUDINARY_API_SECRET || '').trim();

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.pdf': 'application/pdf'
};

const sign = (params) => {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret()).digest('hex');
};

const resourceTypeOf = (ext, mime) => {
  if (mime.startsWith('video/') || ['.mp4', '.webm', '.ogg'].includes(ext)) return 'video';
  if (mime === 'application/pdf' || ext === '.pdf') return 'raw';
  return 'image';
};

const walkFiles = (dir, base = dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, base));
    else if (entry.isFile()) out.push(full);
  }
  return out;
};

const uploadFile = async (absPath, relativePosix) => {
  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const resourceType = resourceTypeOf(ext, mime);
  const publicId = `nikbag/migrated/${relativePosix.replace(/\.[^.]+$/, '')}`.replace(/\\/g, '/');
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp
  };
  const signature = sign(signParams);
  const buffer = fs.readFileSync(absPath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), path.basename(absPath));
  form.append('api_key', apiKey());
  form.append('timestamp', String(timestamp));
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName()}/${resourceType}/upload`, {
    method: 'POST',
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || `Upload failed: ${relativePosix}`);
  }
  return data.secure_url;
};

const replaceInString = (value, map) => {
  if (typeof value !== 'string' || !value) return { value, changed: false };
  let next = value;
  let changed = false;
  for (const [local, remote] of map) {
    if (next === local || next.includes(local)) {
      next = next.split(local).join(remote);
      changed = true;
    }
  }
  return { value: next, changed };
};

const replaceDeep = (doc, map) => {
  let changed = false;
  const walk = (node) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        if (typeof node[i] === 'string') {
          const result = replaceInString(node[i], map);
          if (result.changed) {
            node[i] = result.value;
            changed = true;
          }
        } else if (node[i] && typeof node[i] === 'object') {
          walk(node[i]);
        }
      }
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node)) {
      if (key === '_id' || key === '__v') continue;
      const val = node[key];
      if (typeof val === 'string') {
        const result = replaceInString(val, map);
        if (result.changed) {
          node[key] = result.value;
          changed = true;
        }
      } else if (val && typeof val === 'object') {
        walk(val);
      }
    }
  };
  walk(doc);
  return changed;
};

(async () => {
  if (!cloudName() || !apiKey() || !apiSecret()) {
    console.error('CLOUDINARY_* env eksik.');
    process.exit(1);
  }

  const root = uploadRoot();
  const files = walkFiles(root).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return Object.keys(MIME).includes(ext);
  });

  console.log(`Yüklenecek dosya: ${files.length} (${root})`);

  const urlMap = new Map();
  const errors = [];
  let uploaded = 0;

  for (const abs of files) {
    const relative = path.relative(root, abs).split(path.sep).join('/');
    const localUrl = `/uploads/${relative}`;
    try {
      const remote = await uploadFile(abs, relative);
      urlMap.set(localUrl, remote);
      uploaded += 1;
      console.log(`[${uploaded}/${files.length}] ${localUrl}`);
    } catch (error) {
      errors.push({ localUrl, error: error.message });
      console.error(`FAIL ${localUrl}: ${error.message}`);
    }
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const updated = {};

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    const col = db.collection(name);
    const docs = await col.find({}).toArray();
    let n = 0;
    for (const doc of docs) {
      const id = doc._id;
      if (!replaceDeep(doc, urlMap)) continue;
      delete doc._id;
      await col.replaceOne({ _id: id }, doc);
      n += 1;
    }
    if (n) updated[name] = n;
  }

  // Manifest for client/seed scripts
  const manifestPath = path.join(__dirname, 'cloudinary-upload-map.json');
  const manifest = Object.fromEntries(urlMap.entries());
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    uploaded,
    failed: errors.length,
    errors: errors.slice(0, 20),
    dbUpdated: updated,
    manifest: manifestPath,
    sample: Object.entries(manifest).slice(0, 3)
  }, null, 2));

  await mongoose.disconnect();
  process.exit(errors.length ? 2 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
