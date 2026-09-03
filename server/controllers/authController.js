// const User = require('../models/User');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// // 1. KULLANICI KAYIT (Register)
// const register = async (req, res) => {
//     try {
//         const { adSoyad, email, sifre } = req.body;

//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ mesaj: 'Bu email adresi zaten kullanımda.' });
//         }

//         const user = await User.create({ adSoyad, email, sifre });

//         // GÜVENLİK: Sadece arayüzün ihtiyacı olan zararsız bilgileri dönüyoruz
//         res.status(201).json({
//             mesaj: 'Kayıt başarılı! Kampanya kodunuz oluşturuldu.',
//             kullanici: {
//                 id: user._id,
//                 adSoyad: user.adSoyad,
//                 email: user.email,
//                 kampanyaKodu: user.kampanyaKodu
//             }
//         });

//     } catch (error) {
//         res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
//     }
// };

// // 2. KULLANICI GİRİŞ (Login)
// const login = async (req, res) => {
//     try {
//         const { email, sifre } = req.body;

//         // Karşılaştırma yapabilmek için şifreyi veritabanından zorunlu olarak çekiyoruz
//         const user = await User.findOne({ email });
        
//         // GÜVENLİK: Kullanıcı yoksa veya şifre uyuşmuyorsa AYNI hata mesajını (401 Unauthorized) dönüyoruz.
//         // Bu sayede saldırgan "Böyle bir email var ama şifresi yanlış" çıkarımını yapamaz.
//         if (!user) {
//             return res.status(401).json({ mesaj: 'Geçersiz email veya şifre.' });
//         }

//         const isMatch = await bcrypt.compare(sifre, user.sifre);
//         if (!isMatch) {
//             return res.status(401).json({ mesaj: 'Geçersiz email veya şifre.' });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

//         // GÜVENLİK: Şifre, __v, createdAt gibi hiçbir ekstra veriyi göndermemek için Beyaz Liste kullanıyoruz
//         res.json({
//             mesaj: 'Giriş başarılı',
//             token,
//             kullanici: {
//                 id: user._id,
//                 adSoyad: user.adSoyad,
//                 email: user.email,
//                 kampanyaKodu: user.kampanyaKodu
//             }
//         });

//     } catch (error) {
//         res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
//     }
// };

// // ... (verifyCampaignCode ve getAllUsers fonksiyonlarınız aynen kalabilir)

// // 3. KAMPANYA KODU DOĞRULAMA (Sipariş Sırasında Kullanılacak)
// const verifyCampaignCode = async (req, res) => {
//     try {
//         const { kod } = req.body;

//         // Veritabanında bu koda sahip bir kullanıcı var mı?
//         const user = await User.findOne({ kampanyaKodu: kod });
        
//         if (!user) {
//             return res.status(400).json({ mesaj: 'Geçersiz veya süresi dolmuş kampanya kodu.' });
//         }

//         // Kod doğruysa, frontend'e uygulanacak indirim oranını veya onay mesajını gönder
//         res.json({ 
//             mesaj: 'Kampanya kodu başarıyla uygulandı!', 
//             indirimOrani: 10 // Örnek olarak %10 indirim
//         });

//     } catch (error) {
//         res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
//     }
// };

// // Tüm kullanıcıları listele (Şifreler hariç)
// const getAllUsers = async (req, res) => {
//     try {
//         // .select('-sifre') ile şifre alanını veritabanı sorgusundan çıkarıyoruz
//         const users = await User.find({}).select('-sifre');
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ mesaj: 'Kullanıcılar getirilirken hata oluştu', hata: error.message });
//     }
// };

// module.exports = { register, login, verifyCampaignCode, getAllUsers };






const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Güvenli Cookie Ayarları
const COOKIE_OPTIONS = {
    httpOnly: true, // XSS Koruması: JavaScript erişemez
    secure: process.env.NODE_ENV === 'production', // Production ortamında HTTPS zorunlu
    sameSite: 'lax', // CSRF Koruması
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Gün
};

// 1. KULLANICI KAYIT (Register)
const register = async (req, res) => {
    try {
        const { adSoyad, email, sifre } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ mesaj: 'Bu email adresi zaten kullanımda.' });
        }

        const user = await User.create({ adSoyad, email, sifre });

        // JWT Token üretimi ve HttpOnly Cookie olarak fırlatılması
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, COOKIE_OPTIONS);

        res.status(201).json({
            mesaj: 'Kayıt başarılı! Kampanya kodunuz oluşturuldu.',
            kullanici: {
                id: user._id,
                adSoyad: user.adSoyad,
                email: user.email,
                kampanyaKodu: user.kampanyaKodu
            }
        });

    } catch (error) {
        res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
    }
};

// 2. KULLANICI GİRİŞ (Login)
const login = async (req, res) => {
    try {
        const { email, sifre } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ mesaj: 'Geçersiz email veya şifre.' });
        }

        const isMatch = await bcrypt.compare(sifre, user.sifre);
        if (!isMatch) {
            return res.status(401).json({ mesaj: 'Geçersiz email veya şifre.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // GÜVENLİK: Token yanıt gövdesinde (body) DEĞİL, HttpOnly Cookie içinde gönderiliyor
        res.cookie('token', token, COOKIE_OPTIONS);

        res.json({
            mesaj: 'Giriş başarılı',
            kullanici: {
                id: user._id,
                adSoyad: user.adSoyad,
                email: user.email,
                kampanyaKodu: user.kampanyaKodu
            }
        });

    } catch (error) {
        res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
    }
};

// 3. ANLIK OTURUM DOĞRULAMA (Get Me - Sayfa Yenilendiğinde Çalışır)
const getMe = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ mesaj: 'Oturum bulunamadı.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-sifre');

        if (!user) {
            return res.status(401).json({ mesaj: 'Kullanıcı bulunamadı.' });
        }

        res.json({
            kullanici: {
                id: user._id,
                adSoyad: user.adSoyad,
                email: user.email,
                kampanyaKodu: user.kampanyaKodu
            }
        });
    } catch (error) {
        res.status(401).json({ mesaj: 'Geçersiz veya süresi dolmuş oturum.' });
    }
};

// 4. ÇIKIŞ YAP (Logout - Cookie Silme)
const logout = async (req, res) => {
    try {
        res.clearCookie('token', COOKIE_OPTIONS);
        res.json({ mesaj: 'Başarıyla çıkış yapıldı.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Çıkış yapılırken hata oluştu.' });
    }
};

// 5. KAMPANYA KODU DOĞRULAMA
const verifyCampaignCode = async (req, res) => {
    try {
        const { kod } = req.body;

        const user = await User.findOne({ kampanyaKodu: kod });
        if (!user) {
            return res.status(400).json({ mesaj: 'Geçersiz veya süresi dolmuş kampanya kodu.' });
        }

        res.json({ 
            mesaj: 'Kampanya kodu başarıyla uygulandı!', 
            indirimOrani: 10 
        });

    } catch (error) {
        res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
    }
};

// 6. TÜM KULLANICILARI LİSTELE
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-sifre');
        res.json(users);
    } catch (error) {
        res.status(500).json({ mesaj: 'Kullanıcılar getirilirken hata oluştu', hata: error.message });
    }
};

module.exports = { 
    register, 
    login, 
    getMe, 
    logout, 
    verifyCampaignCode, 
    getAllUsers 
};