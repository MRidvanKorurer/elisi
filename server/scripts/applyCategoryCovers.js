/**
 * Üretilen kategori kapaklarını #946D6D zemine çeker ve MongoDB'ye yazar.
 *
 * Kullanım: node scripts/applyCategoryCovers.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Category = require('../models/Category');
const { CATEGORIES, CATEGORY_LABELS } = require('../constants/categories');

const EXTRA_COVERS = [
  { categoryId: 'aksesuar', name: CATEGORY_LABELS.aksesuar || 'Aksesuar' },
  { categoryId: 'makrome', name: CATEGORY_LABELS.makrome || 'Makrome' }
];

const sharp = require(path.join(__dirname, '../../client/node_modules/sharp'));

const TARGET = { r: 148, g: 109, b: 109 };
const PUBLIC_PREFIX = '/uploads/categories';
const OUT_DIR = path.join(__dirname, '../uploads/categories');
const SOURCE_CANDIDATES = [
  path.join(__dirname, '../../.cursor-category-covers'),
  path.join(process.env.USERPROFILE || '', '.cursor/projects/c-Users-mridv-Desktop-elisi-main-elisi-main/assets'),
  path.join(__dirname, '../../../.cursor/projects/c-Users-mridv-Desktop-elisi-main-elisi-main/assets')
];

const findSourceDir = () => {
  if (process.env.CATEGORY_COVER_SRC && fs.existsSync(process.env.CATEGORY_COVER_SRC)) {
    return process.env.CATEGORY_COVER_SRC;
  }
  return SOURCE_CANDIDATES.find((dir) => (
    fs.existsSync(path.join(dir, 'category-giyim.png'))
    || fs.existsSync(path.join(dir, 'category-aksesuar.png'))
  ));
};

const colorDist = (r, g, b, ref) => {
  const dr = r - ref[0];
  const dg = g - ref[1];
  const db = b - ref[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const isRoseBackdrop = (r, g, b, sample) => {
  if (colorDist(r, g, b, sample) <= 52) return true;
  if (colorDist(r, g, b, [TARGET.r, TARGET.g, TARGET.b]) <= 42) return true;
  const bright = (r + g + b) / 3;
  if (bright > 205) return false;
  const roseLike = r > 88 && r < 205 && g > 48 && g < 165 && b > 48 && b < 165 && r >= g && Math.abs(g - b) < 46;
  return roseLike && (r - Math.min(g, b)) > 10;
};

const flattenBackground = async (srcFile, destFile) => {
  const { data, info } = await sharp(srcFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const idx = (x, y) => (y * width + x) * channels;
  const samplePoints = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), 2],
    [2, Math.floor(height / 2)]
  ];
  const sample = samplePoints.reduce(
    (acc, [x, y]) => {
      const i = idx(x, y);
      acc[0] += data[i];
      acc[1] += data[i + 1];
      acc[2] += data[i + 2];
      return acc;
    },
    [0, 0, 0]
  ).map((value) => value / samplePoints.length);

  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x += 1) {
    stack.push(x, 0, x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(0, y, width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = idx(x, y);
    if (!isRoseBackdrop(data[i], data[i + 1], data[i + 2], sample)) continue;
    data[i] = TARGET.r;
    data[i + 1] = TARGET.g;
    data[i + 2] = TARGET.b;
    data[i + 3] = 255;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  await sharp(data, { raw: { width, height, channels } })
    .resize(900, 900, { fit: 'cover' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(destFile);
};

const main = async () => {
  const sourceDir = findSourceDir();
  if (!sourceDir) {
    throw new Error('Kaynak kapak klasörü bulunamadı. CATEGORY_COVER_SRC ile klasörü verin.');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  await connectDB();

  const requested = (process.env.CATEGORY_COVER_IDS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const catalog = [...CATEGORIES, ...EXTRA_COVERS];
  const targets = requested.length
    ? catalog.filter((item) => requested.includes(item.categoryId))
    : catalog.filter((item) => fs.existsSync(path.join(sourceDir, `category-${item.categoryId}.png`)));

  if (!targets.length) {
    throw new Error('İşlenecek kapak bulunamadı.');
  }

  for (const definition of targets) {
    const srcFile = path.join(sourceDir, `category-${definition.categoryId}.png`);
    if (!fs.existsSync(srcFile)) {
      throw new Error(`Eksik kapak: ${srcFile}`);
    }

    const destFile = path.join(OUT_DIR, `${definition.categoryId}.jpg`);
    await flattenBackground(srcFile, destFile);

    const image = `${PUBLIC_PREFIX}/${definition.categoryId}.jpg?v=rose1`;
    await Category.findOneAndUpdate(
      { categoryId: definition.categoryId },
      {
        $set: {
          name: definition.name,
          image,
          color: '#946D6D'
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`+ ${definition.name} → ${image}`);
  }

  await mongoose.connection.close();
  console.log('\nTüm kategori kapakları #946D6D zeminle kaydedildi.');
};

main().catch(async (error) => {
  console.error('Kapak kaydı başarısız:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
