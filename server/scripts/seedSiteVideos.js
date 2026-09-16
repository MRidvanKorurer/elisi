/**
 * Atölye videolarını uploads'a kopyalar, Lookbook kayıtlarını yazar,
 * ürün kliplerini bağlar.
 * Kullanım: node scripts/seedSiteVideos.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lookbook = require('../models/Lookbook');
const Product = require('../models/Product');

const CLIENT_ASSETS = path.join(__dirname, '../../client/src/assets');
const OPTIMIZED = path.join(CLIENT_ASSETS, 'optimized');
const VIDEO_DIR = path.join(__dirname, '../uploads/videos');
const CLIP_DIR = path.join(__dirname, '../uploads/products/clips');
const PUBLIC_VIDEO = '/uploads/videos';
const PUBLIC_CLIP = '/uploads/products/clips';

const FILES = [
  {
    key: 'hero',
    src: fs.existsSync(path.join(__dirname, '../uploads/videos/hero-atelier-2k.mp4'))
      ? path.join(__dirname, '../uploads/videos/hero-atelier-2k.mp4')
      : path.join(OPTIMIZED, '1.mp4'),
    name: 'hero-orgu.mp4',
    label: 'El emeği koleksiyon',
    placement: 'hero',
    order: 0,
    clip: null,
    posterUrl: '/uploads/videos/hero-atelier-poster.jpg'
  },
  {
    key: 'orgu-doku',
    src: path.join(OPTIMIZED, '2.mp4'),
    name: 'orgu-doku.mp4',
    label: 'El örgüsü detay',
    placement: 'lookbook',
    order: 1,
    clip: 'orgu-doku.mp4'
  },
  {
    key: 'ahsap-sap',
    src: path.join(OPTIMIZED, '3.mp4'),
    name: 'ahsap-bambu-sap.mp4',
    label: 'Ahşap sap detay',
    placement: 'lookbook',
    order: 2,
    clip: 'ahsap-bambu-sap.mp4'
  },
  {
    key: 'atolye-isigi',
    src: path.join(OPTIMIZED, '4.mp4'),
    name: 'atolye-isigi.mp4',
    label: 'Atölye ışığı',
    placement: 'lookbook',
    order: 3,
    clip: 'atolye-isigi.mp4'
  },
  {
    key: 'canta-hareket',
    src: path.join(OPTIMIZED, '5.mp4'),
    name: 'canta-hareket.mp4',
    label: 'Çanta hareket halinde',
    placement: 'lookbook',
    order: 4,
    clip: 'canta-hareket.mp4'
  },
  {
    key: 'clutch-detay',
    src: path.join(OPTIMIZED, '6.mp4'),
    name: 'clutch-detay.mp4',
    label: 'Clutch detayı',
    placement: 'lookbook',
    order: 5,
    clip: 'clutch-detay.mp4'
  },
  {
    key: 'canta1',
    src: path.join(CLIENT_ASSETS, 'canta1.mp4'),
    name: 'canta1.mp4',
    label: 'Atölye filmi',
    placement: 'homepage',
    order: 0,
    clip: null
  }
];

const pickClip = (title = '') => {
  const t = title.toLocaleLowerCase('tr-TR');
  if (/plaj|sahil|deniz|rafya|hasır|hasir/.test(t)) return 'plaj-orgu.mp4';
  if (/ahşap sap|ahsap sap|bambu/.test(t)) return 'ahsap-bambu-sap.mp4';
  if (/atölye|atolye/.test(t)) return 'atolye-isigi.mp4';
  if (/baget|clutch/.test(t)) return 'clutch-detay.mp4';
  if (/omuz|kol çanta|kol canta/.test(t)) return 'canta-hareket.mp4';
  if (/örgü|orgu|makrome/.test(t) && /çanta|canta|clutch/.test(t)) return 'orgu-doku.mp4';
  if (/çanta|canta/.test(t)) return 'canta-hareket.mp4';
  return null;
};

const copyIfPresent = (from, to) => {
  if (!fs.existsSync(from)) return false;
  fs.copyFileSync(from, to);
  return true;
};

(async () => {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(CLIP_DIR, { recursive: true });

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });

  const copied = [];
  const missing = [];

  for (const item of FILES) {
    const dest = path.join(VIDEO_DIR, item.name);
    if (!copyIfPresent(item.src, dest)) {
      missing.push(item.name);
      continue;
    }
    copied.push(item.name);
    if (item.clip) {
      copyIfPresent(item.src, path.join(CLIP_DIR, item.clip));
    }

    await Lookbook.findOneAndUpdate(
      { key: item.key },
      {
        $set: {
          key: item.key,
          title: item.label,
          label: item.label,
          videoUrl: `${PUBLIC_VIDEO}/${item.name}`,
          posterUrl: item.posterUrl || '',
          placement: item.placement,
          order: item.order,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
  }

  await Lookbook.updateMany(
    { key: { $in: ['atolye-isigi', 'canta-hareket', 'clutch-detay'] } },
    { $set: { isActive: false } }
  );

  const products = await Product.find({}).select('title video');
  let assigned = 0;
  for (const product of products) {
    const clip = pickClip(product.title);
    const next = clip ? `${PUBLIC_CLIP}/${clip}` : product.video || '';
    if (next && next !== product.video) {
      product.video = next;
      await product.save();
      assigned += 1;
    }
  }

  console.log(JSON.stringify({ copied, missing, lookbook: FILES.length, productsUpdated: assigned }, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
