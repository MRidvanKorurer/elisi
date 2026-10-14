/**
 * Çevrilecek Türkçe içeriği JSON olarak döker (ürün, kategori, atölye).
 * Kullanım: node scripts/exportContentTr.js > tmp-content-tr.json
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).project({
    title: 1, description: 1, features: 1, careInstructions: 1, measureNote: 1,
    'dimensions.fits': 1, lookbookLabel: 1
  }).toArray();
  const categories = await db.collection('categories').find({}).project({ categoryId: 1, name: 1, description: 1 }).toArray();
  const sellers = await db.collection('sellers').find({}).project({ magazaAdi: 1, aciklama: 1 }).toArray();
  process.stdout.write(JSON.stringify({ products, categories, sellers }, null, 1));
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
