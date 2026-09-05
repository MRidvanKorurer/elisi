const express = require('express');
const router = express.Router();
const { createOrder, iyzicoCallback, getMyOrders, getOrderById } = require('../controllers/orderController');



const { protect, optionalProtect } = require('../middleware/authMiddleware');


router.post('/create', optionalProtect, createOrder);
// İyzico ödeme sonrası kendi sunucularından bu adrese POST atar
router.post('/payment/callback', iyzicoCallback); 

router.get('/myorders', protect, getMyOrders);
router.get('/myorders/:id', protect, getOrderById);

module.exports = router;