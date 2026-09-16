/**
 * Önerilen vitrin ve ürün kartı için örnek gösterim/tıklama üretir.
 * Kullanım: node scripts/seedAdEvents.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Product = require('../models/Product');
const FeaturedRequest = require('../models/FeaturedRequest');
const AdEvent = require('../models/AdEvent');

const daysAgo = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(10 + (days % 8), (days * 7) % 60, 0, 0);
  return date;
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });

  const featured = await FeaturedRequest.find({ status: { $in: ['approved', 'removed'] } }).lean();
  const sponsored = await Product.find({ isSponsored: true }).select('_id seller title').lean();
  const catalog = await Product.find({ isActive: true }).select('_id seller title').limit(12).lean();

  const targets = new Map();
  [...sponsored, ...catalog].forEach((item) => targets.set(String(item._id), item));
  featured.forEach((item) => {
    if (item.product) {
      targets.set(String(item.product), {
        _id: item.product,
        seller: item.seller
      });
    }
  });

  const products = [...targets.values()];
  if (!products.length) {
    console.log('Ürün yok, olay üretilmedi.');
    await mongoose.connection.close();
    return;
  }

  await AdEvent.deleteMany({ session: 'seed-report' });

  const docs = [];
  products.forEach((product, index) => {
    for (let day = 14; day >= 0; day -= 1) {
      const impressions = 4 + ((index + day) % 7);
      const clicks = 1 + ((index + day) % 3);
      const when = daysAgo(day);
      const surface = index < 4 || product.isSponsored ? 'featured' : 'product';
      for (let i = 0; i < impressions; i += 1) {
        docs.push({
          type: 'impression',
          surface,
          product: product._id,
          seller: product.seller || null,
          session: 'seed-report',
          path: surface === 'featured' ? '/' : '/products',
          createdAt: new Date(when.getTime() + i * 60000),
          updatedAt: when
        });
      }
      for (let i = 0; i < clicks; i += 1) {
        docs.push({
          type: 'click',
          surface,
          product: product._id,
          seller: product.seller || null,
          session: 'seed-report',
          path: surface === 'featured' ? '/' : '/products',
          createdAt: new Date(when.getTime() + 5 * 60000 + i * 90000),
          updatedAt: when
        });
      }
    }
  });

  await AdEvent.insertMany(docs);
  console.log(JSON.stringify({ products: products.length, events: docs.length }, null, 2));
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
