const express = require('express');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { publicSite } = require('../utils/runtime');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ success: true, site: publicSite() });
});

router.post('/newsletter', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, mesaj: 'Geçerli bir e-posta yazın.' });
    }
    await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.json({ success: true, mesaj: 'Kayıt alındı.' });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kayıt alınamadı.' });
  }
});

module.exports = router;
