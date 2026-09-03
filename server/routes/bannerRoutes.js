const express = require('express');
const router = express.Router();
const { getActiveBanners } = require('../controllers/bannerController');

// Kullanıcılara banner'ları göstermek için GET isteği
router.get('/', getActiveBanners);

module.exports = router;