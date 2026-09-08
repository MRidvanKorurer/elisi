const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const bcrypt = require('bcrypt');

const uid = (req) => req.user._id || req.user.id;

// @desc    Kullanıcı Profil Bilgilerini Getir
// @route   GET /api/users/profile
// @access  Private (Sadece giriş yapmış kullanıcı)
exports.getProfile = async (req, res) => {
    try {
        // req.user.id, kimlik doğrulama middleware'inden gelmelidir.
        const user = await User.findById(uid(req)).select('-sifre'); // Şifreyi dahil etme

        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası.', error: error.message });
    }
};

// @desc    Kullanıcı Temel Bilgilerini Güncelle (Ad Soyad, Telefon)
// @route   PUT /api/users/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { adSoyad, telefon } = req.body;

        const updates = {};
        if (adSoyad) updates.adSoyad = adSoyad;
        if (telefon) updates.telefon = telefon;

        const user = await User.findByIdAndUpdate(
            uid(req),
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-sifre');

        res.status(200).json({ success: true, message: 'Bilgileriniz güncellendi.', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Güncelleme başarısız.', error: error.message });
    }
};

const { avatarPublicPath, removeUpload } = require('../middleware/uploadMiddleware');

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Profil fotoğrafı seçin.' });
        }

        const user = await User.findById(uid(req));
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        if (user.avatarUrl) removeUpload(user.avatarUrl);
        user.avatarUrl = avatarPublicPath(req.file);
        await user.save();

        const safe = await User.findById(user._id).select('-sifre');
        return res.status(200).json({ success: true, message: 'Profil fotoğrafı güncellendi.', user: safe });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Fotoğraf yüklenemedi.', error: error.message });
    }
};

// @desc    Kullanıcı Şifresini Değiştir
// @route   PUT /api/users/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Mevcut ve yeni şifre gereklidir.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalıdır.' });
        }

        const user = await User.findById(uid(req));
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.sifre);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mevcut şifreniz hatalı.' });
        }

        // 3. Yeni şifreyi ata ve kaydet (Modeldeki pre-savemiddleware hash'leyecektir)
        user.sifre = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Şifreniz başarıyla değiştirildi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Şifre değiştirilemedi.', error: error.message });
    }
};

// ==========================================
// ADRES YÖNETİMİ CONTROLLER'LARI
// ==========================================

// @desc    Yeni Adres Ekle
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { baslik, adSoyad, telefon, adres, il, ilce } = req.body;
        if (!baslik || !adSoyad || !telefon || !adres || !il || !ilce) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm adres alanlarını doldurun.' });
        }

        const user = await User.findById(uid(req));
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // Eğer bu eklenen ilk adres ise, otomatik olarak varsayılan yap
        if (user.adresler.length === 0) {
            req.body.isDefault = true;
        }

        user.adresler.push(req.body); // Dizinin sonuna ekle
        await user.save();

        // Sadece eklenen son adresi ve güncel listeyi dön
        const addedAddress = user.adresler[user.adresler.length - 1];
        res.status(201).json({ success: true, message: 'Adres eklendi.', addedAddress, addresses: user.adresler });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Adres eklenemedi.', error: error.message });
    }
};

// @desc    Adres Sil
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(uid(req));

        // Adresi $pull operatörü ile ID'sine göre diziden çıkar
        user.adresler.pull(addressId);
        await user.save();

        res.status(200).json({ success: true, message: 'Adres silindi.', addresses: user.adresler });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Adres silinemedi.', error: error.message });
    }
};

exports.addCard = async (req, res) => {
    try {
        const user = await User.findById(uid(req));
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }
        const { kartSahibi, kartNumarasi, skt } = req.body;

        if (!kartSahibi || !kartNumarasi || !skt) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm kart alanlarını doldurun.' });
        }

        const digits = String(kartNumarasi).replace(/\D/g, '');
        if (digits.length < 12) {
            return res.status(400).json({ success: false, message: 'Geçerli bir kart numarası giriniz.' });
        }

        const son4Hane = digits.slice(-4);
        const kartTipi = digits.startsWith('4') ? 'Visa' : 'Mastercard';

        const newCard = {
            kartSahibi,
            son4Hane,
            skt,
            kartTipi,
            cardToken: 'mock_token_' + Date.now() // Sanal token
        };

        user.kayitliKartlar.push(newCard);
        await user.save();

        res.status(201).json({ success: true, message: 'Kart başarıyla eklendi.', savedCards: user.kayitliKartlar });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kart eklenemedi.', error: error.message });
    }
};

// @desc    Kart Sil
// @route   DELETE /api/users/cards/:cardId
// @access  Private
exports.deleteCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const user = await User.findById(uid(req));

        user.kayitliKartlar.pull(cardId);
        await user.save();

        res.status(200).json({ success: true, message: 'Kart silindi.', savedCards: user.kayitliKartlar });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kart silinemedi.', error: error.message });
    }
};



exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: uid(req) }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Siparişler getirilemedi.', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        if (order.user && order.user.toString() !== String(uid(req))) {
            return res.status(403).json({ success: false, message: 'Bu siparişi görüntüleme yetkiniz yok.' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Sipariş detayı alınırken hata:', error);
        res.status(500).json({ success: false, message: 'Sipariş detayı alınamadı.', error: error.message });
    }
};

// ==========================================
// FAVORİLER (WISHLIST) CONTROLLER
// ==========================================

// @desc    Kullanıcının Favorilerini Getir
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(uid(req)).populate('favoriler');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        const favorites = (user.favoriler || []).filter(Boolean);
        res.status(200).json({ success: true, favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Favoriler alınamadı.', error: error.message });
    }
};

// @desc    Favorilere Ürün Ekle
// @route   POST /api/users/favorites
// @access  Private
exports.addFavorite = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Ürün ID gerekli.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        }

        const user = await User.findById(uid(req));
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        const alreadySaved = user.favoriler.some((id) => String(id) === String(productId));
        if (alreadySaved) {
            return res.status(400).json({ success: false, message: 'Bu ürün zaten favorilerinizde.' });
        }

        user.favoriler.push(productId);
        await user.save();

        const updatedUser = await User.findById(uid(req)).populate('favoriler');

        res.status(200).json({ success: true, message: 'Ürün favorilere eklendi.', favorites: updatedUser.favoriler });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Favoriye eklenemedi.', error: error.message });
    }
};

// @desc    Favorilerden Ürün Sil
// @route   DELETE /api/users/favorites/:productId
// @access  Private
exports.removeFavorite = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(uid(req));

        user.favoriler.pull(productId); // ID'yi diziden çıkar
        await user.save();

        res.status(200).json({ success: true, message: 'Ürün favorilerden çıkarıldı.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Favoriden silinemedi.', error: error.message });
    }
};