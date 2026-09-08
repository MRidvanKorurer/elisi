/**
 * Atölye kliplerini ürün adına göre bağlar.
 * Kullanım: node scripts/assignProductVideos.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const SRC = path.join(__dirname, '../../client/src/assets/optimized');
const DEST = path.join(__dirname, '../uploads/products/clips');
const PUBLIC = '/uploads/products/clips';

const CLIPS = {
  plaj: { file: '1.mp4', name: 'plaj-orgu.mp4' },
  doku: { file: '2.mp4', name: 'orgu-doku.mp4' },
  sap: { file: '3.mp4', name: 'ahsap-bambu-sap.mp4' },
  atolye: { file: '4.mp4', name: 'atolye-isigi.mp4' },
  omuz: { file: '5.mp4', name: 'canta-hareket.mp4' },
  clutch: { file: '6.mp4', name: 'clutch-detay.mp4' }
};

const pickClip = (title = '') => {
  const t = title.toLocaleLowerCase('tr-TR');

  if (/plaj|sahil|deniz|rafya|hasır|hasir/.test(t)) return 'plaj';
  if (/ahşap sap|ahsap sap|bambu/.test(t)) return 'sap';
  if (/atölye|atolye/.test(t)) return 'atolye';
  if (/baget|clutch/.test(t)) return 'clutch';
  if (/omuz|kol çanta|kol canta/.test(t)) return 'omuz';
  if (/örgü|orgu|makrome/.test(t) && /çanta|canta|clutch/.test(t)) return 'doku';
  if (/hamak|duvar süsü|duvar susu/.test(t)) return 'atolye';
  return null;
};

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  Object.values(CLIPS).forEach((clip) => {
    fs.copyFileSync(path.join(SRC, clip.file), path.join(DEST, clip.name));
  });

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });

  const products = await Product.find({}).select('title video category');
  const assigned = [];
  const cleared = [];

  for (const product of products) {
    const key = pickClip(product.title);
    const next = key ? `${PUBLIC}/${CLIPS[key].name}` : '';
    const prev = product.video || '';
    if (prev === next) continue;
    product.video = next;
    await product.save();
    if (next) assigned.push({ title: product.title, clip: CLIPS[key].name });
    else if (prev) cleared.push(product.title);
  }

  console.log(JSON.stringify({ assigned, cleared }, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
