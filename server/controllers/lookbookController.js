const path = require('path');
const fs = require('fs');
const Lookbook = require('../models/Lookbook');

const publicUrl = (filename, folder) => `/uploads/${folder}/${filename}`;

const listLookbook = async (req, res) => {
  try {
    const includeInactive = req.user?.rol === 'superadmin' && req.query.all === '1';
    const filter = includeInactive ? {} : { isActive: true };
    const items = await Lookbook.find(filter).sort({ order: 1, createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Lookbook alınamadı.', hata: error.message });
  }
};

const createLookbook = async (req, res) => {
  try {
    const videoFile = req.files?.video?.[0];
    if (!videoFile) {
      return res.status(400).json({ mesaj: 'Video dosyası zorunludur.' });
    }

    const posterFile = req.files?.poster?.[0];
    const item = await Lookbook.create({
      title: String(req.body.title || '').trim(),
      label: String(req.body.label || req.body.title || 'Lookbook').trim(),
      videoUrl: publicUrl(videoFile.filename, 'lookbook'),
      posterUrl: posterFile ? publicUrl(posterFile.filename, 'lookbook') : '',
      product: req.body.productId && String(req.body.productId).trim() ? req.body.productId : null,
      order: Number(req.body.order) || 0,
      isActive: req.body.isActive !== 'false'
    });

    return res.status(201).json({ success: true, item, mesaj: 'Video eklendi.' });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Video eklenemedi.', hata: error.message });
  }
};

const deleteLookbook = async (req, res) => {
  try {
    const item = await Lookbook.findById(req.params.id);
    if (!item) return res.status(404).json({ mesaj: 'Kayıt bulunamadı.' });

    const unlinkIfLocal = (url) => {
      if (!url || !url.startsWith('/uploads/')) return;
      const filePath = path.join(__dirname, '..', url);
      fs.promises.unlink(filePath).catch(() => {});
    };

    unlinkIfLocal(item.videoUrl);
    unlinkIfLocal(item.posterUrl);
    await item.deleteOne();
    return res.json({ success: true, mesaj: 'Kayıt silindi.' });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Silinemedi.', hata: error.message });
  }
};

module.exports = { listLookbook, createLookbook, deleteLookbook };
