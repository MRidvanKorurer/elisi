const express = require('express');
const router = express.Router();
const { getCart, addToCart, clearCart, removeFromCart, updateCartItem } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); // Kendi yetkilendirme middleware'in

// Tüm sepet işlemleri giriş yapmış bir kullanıcı gerektirir, bu yüzden protect middleware'i kullanıyoruz.
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/clear', clearCart);
router.patch('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);

module.exports = router;