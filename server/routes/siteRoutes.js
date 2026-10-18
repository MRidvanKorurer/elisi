const express = require('express');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { publicSite } = require('../utils/runtime');
const { resolveBank } = require('../utils/bank');
const { getUsdTry } = require('../services/exchangeRate');
const { notifyAdmin } = require('../services/emailService');

const router = express.Router();

router.get('/', async (_req, res) => {
  const account = await resolveBank();
  res.json({ success: true, site: publicSite({ bank: account }) });
});

router.get('/rates', async (_req, res) => {
  const rate = await getUsdTry();
  if (!rate) return res.status(503).json({ success: false, mesaj: 'Döviz kuru alınamadı.' });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, ...rate });
});

router.post('/newsletter', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, mesaj: 'Geçerli bir e-posta yazın.' });
    }
    const result = await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.json({ success: true, mesaj: 'Kayıt alındı.' });
    if (result.upsertedCount) {
      notifyAdmin({
        subject: 'Yeni bülten abonesi',
        intro: 'Bir ziyaretçi e-bültene abone oldu.',
        fields: [['E-posta', email]]
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kayıt alınamadı.' });
  }
});

module.exports = router;
