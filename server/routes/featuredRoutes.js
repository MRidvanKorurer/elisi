const express = require('express');
const router = express.Router();
const { getFeaturedMeta } = require('../controllers/featuredController');

router.get('/meta', getFeaturedMeta);

module.exports = router;
