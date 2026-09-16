const crypto = require('crypto');

const cloudName = () => String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = () => String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = () => String(process.env.CLOUDINARY_API_SECRET || '').trim();

const configured = () => Boolean(cloudName() && apiKey() && apiSecret());

const sign = (params) => {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret()).digest('hex');
};

const resourceTypeOf = (file) => {
  if (/^video\//.test(file?.mimetype || '')) return 'video';
  if (file?.mimetype === 'application/pdf') return 'raw';
  return 'image';
};

const missingConfigError = () => {
  const err = new Error('Görseller ücretsiz Cloudinary deposuna yazılır. Kart gerekmez. cloudinary.com/users/register_free adresinden hesap açıp CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET değerlerini sunucu .env dosyasına ekleyin.');
  err.status = 503;
  return err;
};

const putMedia = async (file, folder) => {
  if (!configured()) throw missingConfigError();
  if (!file?.buffer?.length) {
    const err = new Error('Dosya okunamadı.');
    err.status = 400;
    throw err;
  }

  const safeFolder = String(folder || 'media').replace(/[^a-z0-9_-]/gi, '') || 'media';
  const resourceType = resourceTypeOf(file);
  const publicId = `nikbag/${safeFolder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }), file.originalname || 'upload');
  form.append('api_key', apiKey());
  form.append('timestamp', String(timestamp));
  form.append('public_id', publicId);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName()}/${resourceType}/upload`, {
    method: 'POST',
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) {
    const err = new Error(data?.error?.message || 'Görsel Cloudinary’ye yüklenemedi.');
    err.status = response.status === 401 ? 503 : 502;
    throw err;
  }
  return data.secure_url;
};

const parseRemote = (url) => {
  let parsed;
  try {
    parsed = new URL(String(url || ''));
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  const resourceType = parts[1];
  if (!['image', 'video', 'raw'].includes(resourceType) || parts[2] !== 'upload') return null;
  let rest = parts.slice(3);
  if (/^v\d+$/.test(rest[0] || '')) rest = rest.slice(1);
  const file = rest.join('/');
  if (!file || file.includes('..')) return null;
  return {
    resourceType,
    publicId: resourceType === 'raw' ? file : file.replace(/\.[a-z0-9]+$/i, '')
  };
};

const removeRemote = async (url) => {
  const remote = parseRemote(url);
  if (!remote || !configured()) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({
    public_id: remote.publicId,
    timestamp: String(timestamp),
    api_key: apiKey(),
    signature: sign({ public_id: remote.publicId, timestamp })
  });
  await fetch(`https://api.cloudinary.com/v1_1/${cloudName()}/${remote.resourceType}/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  }).catch(() => {});
};

const collectFiles = (req) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((list) => {
      if (Array.isArray(list)) files.push(...list);
    });
  }
  return files;
};

const storeUploaded = (folder) => (req, res, next) => {
  const files = collectFiles(req);
  (async () => {
    for (const file of files) {
      file.storedUrl = await putMedia(file, folder);
    }
  })()
    .then(() => next())
    .catch((err) => {
      Promise.all(files.filter((file) => file.storedUrl).map((file) => removeRemote(file.storedUrl)))
        .finally(() => next(err));
    });
};

module.exports = {
  configured,
  putMedia,
  removeRemote,
  storeUploaded
};
