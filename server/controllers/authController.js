const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { WELCOME_PERCENT, normalizeCode, generateWelcomeCode, couponAlreadyConsumed, syncWelcomeCouponFlag } = require('../utils/welcomeCoupon');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
};

const publicUser = (user) => ({
    id: user._id,
    adSoyad: user.adSoyad,
    email: user.email,
    telefon: user.telefon || '',
    kampanyaKodu: user.kampanyaKodu || '',
    kampanyaKullanildi: Boolean(user.kampanyaKullanildi),
    kampanyaIndirim: WELCOME_PERCENT,
    rol: user.rol,
    avatarUrl: user.avatarUrl || ''
});

const ensureWelcomeCode = async (user) => {
    if (user.kampanyaKodu) return user;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        user.kampanyaKodu = generateWelcomeCode();
        try {
            await user.save();
            return user;
        } catch (error) {
            if (error?.code !== 11000) throw error;
        }
    }
    return user;
};

const register = async (req, res) => {
    try {
        const { adSoyad, email, sifre } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ mesaj: 'Bu email adresi zaten kullanımda.' });
        }

        const user = await User.create({ adSoyad, email, sifre });
        await ensureWelcomeCode(user);
        user.kampanyaKullanildi = false;

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, COOKIE_OPTIONS);

        res.status(201).json({
            mesaj: `Kayıt başarılı! İlk siparişine özel %${WELCOME_PERCENT} indirim kodun hazır.`,
            kullanici: publicUser(user)
        });
    } catch (error) {
        res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
    }
};

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

        await ensureWelcomeCode(user);
        await syncWelcomeCouponFlag(user);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, COOKIE_OPTIONS);

        res.json({
            mesaj: 'Giriş başarılı',
            kullanici: publicUser(user)
        });
    } catch (error) {
        res.status(500).json({ mesaj: 'Sunucu hatası', hata: error.message });
    }
};

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

        await ensureWelcomeCode(user);
        await syncWelcomeCouponFlag(user);

        res.json({ kullanici: publicUser(user) });
    } catch (error) {
        res.status(401).json({ mesaj: 'Geçersiz veya süresi dolmuş oturum.' });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('token', COOKIE_OPTIONS);
        res.json({ mesaj: 'Başarıyla çıkış yapıldı.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Çıkış yapılırken hata oluştu.' });
    }
};

const verifyCampaignCode = async (req, res) => {
    try {
        const kod = normalizeCode(req.body.kod || req.body.code);
        if (!kod) {
            return res.status(400).json({ success: false, mesaj: 'Bir indirim kodu yaz.' });
        }

        const mine = normalizeCode(req.user.kampanyaKodu);
        if (!mine || mine !== kod) {
            return res.status(400).json({ success: false, mesaj: 'Bu kod bu hesaba ait değil veya geçersiz.' });
        }
        await syncWelcomeCouponFlag(req.user);
        if (await couponAlreadyConsumed(req.user, { ignorePendingCard: true })) {
            return res.status(400).json({ success: false, mesaj: 'Hoş geldin indirimin yalnızca ilk siparişte geçerlidir.' });
        }

        res.json({
            success: true,
            mesaj: `Kod uygulandı. İlk siparişine %${WELCOME_PERCENT} indirim.`,
            indirimOrani: WELCOME_PERCENT,
            kod: req.user.kampanyaKodu
        });
    } catch (error) {
        res.status(500).json({ success: false, mesaj: 'Sunucu hatası' });
    }
};

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
