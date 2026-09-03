const express = require('express');
const router = express.Router();
const { createOrder, iyzicoCallback } = require('../controllers/orderController');


router.post('/create', createOrder);
// İyzico ödeme sonrası kendi sunucularından bu adrese POST atar
router.post('/payment/callback', iyzicoCallback); 

module.exports = router;