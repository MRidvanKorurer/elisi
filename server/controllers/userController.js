const User = require('../models/User'); // User modelini içe aktar
const bcrypt = require('bcrypt'); // Şifre doğrulama için

// @desc    Kullanıcı Profil Bilgilerini Getir
// @route   GET /api/users/profile
// @access  Private (Sadece giriş yapmış kullanıcı)
exports.getProfile = async (req, res) => {
    try {
        // req.user.id, kimlik doğrulama middleware'inden gelmelidir.
        const user = await User.findById(req.user.id).select('-sifre'); // Şifreyi dahil etme

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

        // Güncellenecek alanları hazırla
        const updates = {};
        if (adSoyad) updates.adSoyad = adSoyad;
        if (telefon) updates.telefon = telefon;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true } // Yeni veriyi dön ve modeli doğrula
        ).select('-sifre');

        res.status(200).json({ success: true, message: 'Bilgileriniz güncellendi.', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Güncelleme başarısız.', error: error.message });
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

        // 1. Kullanıcıyı ve şifresini bul
        const user = await User.findById(req.user.id);
        
        // 2. Mevcut şifreyi doğrula
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
        // req.body'den adres bilgilerini al (baslik, adSoyad, telefon, adres, il, ilce)
        const user = await User.findById(req.user.id);

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

        const user = await User.findById(req.user.id);

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
        const user = await User.findById(req.user.id);
        const { kartSahibi, kartNumarasi, skt } = req.body;

        if (!kartSahibi || !kartNumarasi || !skt) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm kart alanlarını doldurun.' });
        }

        // GÜVENLİK: Tam kart numarası asla veritabanına yazılmaz!
        // Sadece son 4 haneyi alıyoruz. (Gerçek senaryoda burada PayTR, Iyzico token'ı alınır)
        const son4Hane = kartNumarasi.slice(-4);
        const kartTipi = kartNumarasi.startsWith('4') ? 'Visa' : 'Mastercard'; // Basit bir belirleyici

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
        const user = await User.findById(req.user.id);

        user.kayitliKartlar.pull(cardId);
        await user.save();

        res.status(200).json({ success: true, message: 'Kart silindi.', savedCards: user.kayitliKartlar });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kart silinemedi.', error: error.message });
    }
};



exports.getOrders = async (req, res) => {
    try {
        // NOT: Gerçek bir projede Order modelini içe aktarıp şöyle kullanırsın:
        // const Order = require('../models/Order');
        // const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        
        // Şimdilik frontend'in test edilebilmesi için örnek bir yanıt (veya boş dizi) dönüyoruz:
        const mockOrders = [
            { id: '#SP-10924', date: '12 Ekim 2023', status: 'Teslim Edildi', statusColor: '#81B29A', total: '1.250 TL', items: 2 },
            { id: '#SP-11045', date: '3 Kasım 2023', status: 'Kargoda', statusColor: '#DDA15E', total: '450 TL', items: 1 }
        ];

        res.status(200).json({ success: true, orders: mockOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Siparişler getirilemedi.', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        // 1. Siparişi ID'sine göre veritabanından bul
        const order = await Order.findById(orderId);

        // 2. Sipariş yoksa hata dön
        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        // 3. Güvenlik Kontrolü: Giriş yapan kullanıcı, siparişin sahibi mi?
        // (Order modelinizde kullanıcı referansını 'user' veya 'kullanici' olarak nasıl tanımladıysanız ona göre eşleştirin)
        if (order.user && order.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Bu siparişi görüntüleme yetkiniz yok.' });
        }

        // Başarılı ise siparişi gönder
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
        const user = await User.findById(req.user.id).populate('favoriler'); // Ürün detaylarını (isim, fiyat, görsel) getir
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        res.status(200).json({ success: true, favorites: user.favoriler });
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
        const user = await User.findById(req.user.id);

        // Ürün zaten favorilerde mi kontrol et
        if (user.favoriler.includes(productId)) {
            return res.status(400).json({ success: false, message: 'Bu ürün zaten favorilerinizde.' });
        }

        user.favoriler.push(productId);
        await user.save();

        // Güncel favori listesini ürün detaylarıyla birlikte döndür
        const updatedUser = await User.findById(req.user.id).populate('favoriler');

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
        const user = await User.findById(req.user.id);

        user.favoriler.pull(productId); // ID'yi diziden çıkar
        await user.save();

        res.status(200).json({ success: true, message: 'Ürün favorilerden çıkarıldı.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Favoriden silinemedi.', error: error.message });
    }
};