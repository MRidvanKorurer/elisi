/**
 * Mevcut ürün, kategori ve atölye içeriğinin İngilizce kopyasını yazar.
 * Elle hazırlanmış metinler scripts/data/contentEn.js'ten, eksikler çeviri servisinden gelir.
 *
 * Kullanım: node scripts/translateContent.js [--force] [--dry]
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const data = require('./data/contentEn');
const {
  productSource,
  hashOf,
  buildProductEn,
  saveProductEn,
  buildCategoryEn,
  buildSellerEn,
  stripComplete
} = require('../services/contentTranslation');

const force = process.argv.includes('--force');
const dry = process.argv.includes('--dry');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const report = { products: 0, categories: 0, sellers: 0, incomplete: [] };

  const products = await Product.find({}).lean();
  for (const doc of products) {
    if (!force && doc.en?.sourceHash && doc.en.sourceHash === hashOf(productSource(doc))) continue;
    const built = await buildProductEn(doc, data.products[String(doc._id)] || {});
    if (!built.complete) report.incomplete.push(`product ${doc._id} ${doc.title}`);
    if (!dry) await saveProductEn(doc._id, built);
    report.products += 1;
  }

  const categories = await Category.find({}).lean();
  for (const doc of categories) {
    const built = await buildCategoryEn(doc, { description: data.categories[doc.categoryId] });
    if (!built.complete) report.incomplete.push(`category ${doc.categoryId}`);
    if (!dry) await Category.updateOne({ _id: doc._id }, { $set: { en: stripComplete(built) } }, { timestamps: false });
    report.categories += 1;
  }

  const sellers = await Seller.find({}).lean();
  for (const doc of sellers) {
    const built = await buildSellerEn(doc, { aciklama: data.sellers[String(doc._id)] });
    if (!built.complete) report.incomplete.push(`seller ${doc._id} ${doc.magazaAdi}`);
    if (!dry) await Seller.updateOne({ _id: doc._id }, { $set: { en: stripComplete(built) } }, { timestamps: false });
    report.sellers += 1;
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
