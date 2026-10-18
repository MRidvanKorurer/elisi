/**
 * Ana sayfa filmini (client/src/assets/canta1.mp4) Cloudinary'ye yükler ve
 * admin panelden düzenlenebilmesi için "homepage" Lookbook kaydı olarak yazar.
 * Kayıt zaten varsa dokunmaz.
 * Kullanım: node scripts/seedHomepageFilm.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lookbook = require('../models/Lookbook');
const { putMedia } = require('../utils/mediaStore');
const { hashOf } = require('../services/contentTranslation');

const VIDEO = path.join(__dirname, '../../client/src/assets/canta1.mp4');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const existing = await Lookbook.findOne({ placement: 'homepage' }).lean();
  if (existing) {
    console.log(JSON.stringify({ skipped: true, id: existing._id, isActive: existing.isActive }));
    await mongoose.disconnect();
    return;
  }

  const videoUrl = await putMedia({
    buffer: fs.readFileSync(VIDEO),
    mimetype: 'video/mp4',
    originalname: 'atolye-filmi.mp4'
  }, 'videos');

  const text = {
    title: 'Çanta, Işık ve El Emeği',
    label: 'Atölye Filmi',
    subtitle: 'Koleksiyonun çekilmiş tam karesi.'
  };
  const now = new Date();
  const { insertedId } = await Lookbook.collection.insertOne({
    ...text,
    key: 'homepage-film',
    placement: 'homepage',
    videoUrl,
    posterUrl: '',
    product: null,
    order: 1,
    isActive: true,
    en: {
      title: 'Bag, Light, and Craft',
      label: 'Atelier Film',
      subtitle: 'The collection, shot in the studio.',
      sourceHash: hashOf(text),
      translatedAt: now
    },
    createdAt: now,
    updatedAt: now
  });

  console.log(JSON.stringify({ id: insertedId, videoUrl }));
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
