const express = require('express');
const router = express.Router();
const { verifyPromo } = require('../controllers/promoController');

router.post('/verify', verifyPromo);

module.exports = router;
