const express = require('express');
const router = express.Router();

// Controller fonksiyonlarını içe aktar
// Kendi sistemindeki isimlendirmeye göre getProfile veya getMe olarak alabilirsin.
const {
    getProfile, // veya getMe
    updateProfile,
    changePassword,
    addAddress,
    deleteAddress,
    addCard,
    deleteCard,
    getOrders,
    getFavorites, addFavorite, removeFavorite
} = require('../controllers/userController');

// Kimlik doğrulama ara katmanını (Middleware) içe aktar
// JWT kontrolü yapan middleware'in yolunu projene göre ayarla
const { protect } = require('../middleware/authMiddleware'); // Kendi dosya ismine göre değiştir 

// ==========================================
// 1. PROFİL ROTALARI
// ==========================================

// GET /api/users/profile - Profil bilgilerini getir (Frontend'deki isteği karşılar)
router.get('/profile', protect, getProfile);

// PUT /api/users/profile/update - Ad, Soyad, Telefon güncelle
router.put('/profile/update', protect, updateProfile);

// PUT /api/users/profile/change-password - Şifre değiştir
router.put('/profile/change-password', protect, changePassword);

// ==========================================
// 2. ADRES ROTALARI
// ==========================================

// POST /api/users/addresses - Yeni adres ekle
router.post('/addresses', protect, addAddress);

// DELETE /api/users/addresses/:addressId - Belirli bir adresi sil
router.delete('/addresses/:addressId', protect, deleteAddress);


router.post('/cards', protect, addCard);


router.delete('/cards/:cardId', protect, deleteCard);


router.get('/orders', protect, getOrders);

router.get('/favorites', protect, getFavorites);
router.post('/favorites', protect, addFavorite);
router.delete('/favorites/:productId', protect, removeFavorite);



module.exports = router;