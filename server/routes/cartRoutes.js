const express = require('express');
const router = express.Router();
const { getCart, addToCart, clearCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); // Kendi yetkilendirme middleware'in

// Tüm sepet işlemleri giriş yapmış bir kullanıcı gerektirir, bu yüzden protect middleware'i kullanıyoruz.
router.use(protect);

router.get('/', getCart);             // Sepeti getir
router.post('/', addToCart);          // Sepete ürün ekle
router.delete('/clear', clearCart);   // Sepeti boşalt
router.delete('/:productId', removeFromCart)

module.exports = router;