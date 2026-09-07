/**
 * Ana kategori listesini yazar ve kapak görsellerini üretir.
 *
 * Kullanım: npm run seed:categories
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { CATEGORIES, CATEGORY_IDS } = require('../constants/categories');

const run = promisify(execFile);

const CLIENT_ASSETS = path.join(__dirname, '../../client/src/assets');
const PHOTO_DIR = path.join(CLIENT_ASSETS, 'sendgb-p7W4jZ0UCo1');
const OUT_DIR = path.join(__dirname, '../uploads/categories');
const PUBLIC_PREFIX = '/uploads/categories';

const COVER_FALLBACKS = [
  { dir: PHOTO_DIR, file: 'koyu1.jpg' },
  { dir: PHOTO_DIR, file: '2.jpg' },
  { dir: CLIENT_ASSETS, file: 'banner2.jpeg' },
  { dir: PHOTO_DIR, file: 'koyu4.jpg' },
  { dir: CLIENT_ASSETS, file: 'banner3.jpeg' },
  { dir: PHOTO_DIR, file: 'koyu2.jpg' },
  { dir: CLIENT_ASSETS, file: 'banner4.jpeg' },
  { dir: PHOTO_DIR, file: 'koyu3.jpg' },
  { dir: PHOTO_DIR, file: 'kolaj.jpg' }
];

const resolveFfmpeg = () => {
  try {
    return require(path.join(__dirname, '../../client/node_modules/ffmpeg-static'));
  } catch {
    return null;
  }
};

const localUploadPath = (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return null;
  const filePath = path.join(__dirname, '..', url.replace(/\//g, path.sep));
  return fs.existsSync(filePath) ? filePath : null;
};

const writeCover = async (ffmpeg, sourcePath, outFile) => {
  if (ffmpeg) {
    try {
      await run(ffmpeg, [
        '-y',
        '-i', sourcePath,
        '-vf', 'scale=1200:1500:force_original_aspect_ratio=increase,crop=1200:1500',
        '-q:v',
        '3',
        outFile
      ]);
      return;
    } catch {
      // kopyaya düş
    }
  }
  fs.copyFileSync(sourcePath, outFile);
};

const main = async () => {
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await connectDB();

  const productCovers = await Product.aggregate([
    {
      $match: {
        isActive: true,
        approvalStatus: { $nin: ['pending', 'rejected'] },
        image: { $exists: true, $nin: [null, ''] }
      }
    },
    { $sort: { soldCount: -1, createdAt: -1 } },
    { $group: { _id: { $toLower: '$category' }, image: { $first: '$image' } } }
  ]);
  const productImageByCategory = Object.fromEntries(
    productCovers.map((row) => [row._id, row.image])
  );

  let written = 0;

  for (const [index, definition] of CATEGORIES.entries()) {
    const outFile = path.join(OUT_DIR, `${definition.categoryId}.jpg`);
    const publicImage = `${PUBLIC_PREFIX}/${definition.categoryId}.jpg`;
    const fallback = COVER_FALLBACKS[index % COVER_FALLBACKS.length];

    const existingCover = fs.existsSync(outFile) ? outFile : null;
    if (!existingCover) {
      const productSource = localUploadPath(productImageByCategory[definition.categoryId]);
      const fallbackSource = path.join(fallback.dir, fallback.file);
      const sourcePath = productSource
        || (fs.existsSync(fallbackSource) ? fallbackSource : null);

      if (sourcePath) {
        await writeCover(ffmpeg, sourcePath, outFile);
      }
    }

    const image = fs.existsSync(outFile) ? publicImage : '';

    await Category.findOneAndUpdate(
      { categoryId: definition.categoryId },
      {
        $set: {
          ...definition,
          image,
          isActive: true
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    written += 1;
    console.log(`+ ${definition.name} [${definition.categoryId}]${image ? ` → ${image}` : ''}`);
  }

  const deactivated = await Category.updateMany(
    { categoryId: { $nin: CATEGORY_IDS } },
    { $set: { isActive: false } }
  );

  console.log(`\nToplam: ${written} kategori güncellendi.`);
  if (deactivated.modifiedCount) {
    console.log(`Pasif yapılan eski kategori: ${deactivated.modifiedCount}`);
  }
  await mongoose.connection.close();
};

main().catch(async (error) => {
  console.error('Kategori tohumlama başarısız:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
