const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { WELCOME_PERCENT, normalizeCode, generateWelcomeCode, couponAlreadyConsumed, syncWelcomeCouponFlag } = require('../utils/welcomeCoupon');

const { cookieOptions } = require('../utils/runtime');
const COOKIE_OPTIONS = cookieOptions();

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
        if (!sifre || String(sifre).length < 8) {
            return res.status(400).json({ mesaj: 'Şifre en az 8 karakter olmalı.' });
        }

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

        if (!user.sifre) {
            return res.status(401).json({
                mesaj: 'Bu hesap Google ile oluşturulmuş. Lütfen Google ile giriş yapın.'
            });
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

const resolveGoogleProfile = async ({ credential, accessToken, clientId }) => {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);

    if (credential) {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            const err = new Error('Google hesabı doğrulanamadı.');
            err.status = 401;
            throw err;
        }
        return {
            googleId: payload.sub,
            email: String(payload.email).toLowerCase().trim(),
            adSoyad: (payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.email.split('@')[0]).trim(),
            avatarUrl: payload.picture || ''
        };
    }

    if (accessToken) {
        const tokenInfo = await client.getTokenInfo(accessToken);
        const audiences = []
            .concat(tokenInfo.aud || [])
            .concat(tokenInfo.azp || [])
            .filter(Boolean);
        if (audiences.length && !audiences.includes(clientId)) {
            const err = new Error('Google istemci doğrulaması başarısız.');
            err.status = 401;
            throw err;
        }

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) {
            const err = new Error('Google profili alınamadı.');
            err.status = 401;
            throw err;
        }
        const profile = await response.json();
        if (!profile?.email || profile.email_verified === false) {
            const err = new Error('Google hesabı doğrulanamadı.');
            err.status = 401;
            throw err;
        }
        return {
            googleId: profile.sub || tokenInfo.sub,
            email: String(profile.email).toLowerCase().trim(),
            adSoyad: (profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.email.split('@')[0]).trim(),
            avatarUrl: profile.picture || ''
        };
    }

    const err = new Error('Google oturum bilgisi eksik.');
    err.status = 400;
    throw err;
};

const googleAuth = async (req, res) => {
    try {
        const credential = req.body.credential || req.body.idToken;
        const accessToken = req.body.accessToken || req.body.access_token;

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ mesaj: 'Google girişi yapılandırılmamış.' });
        }

        const { googleId, email, adSoyad, avatarUrl } = await resolveGoogleProfile({
            credential,
            accessToken,
            clientId
        });

        let user = await User.findOne({ googleId });
        let isNewUser = false;

        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleId;
                if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
                if (!user.adSoyad && adSoyad) user.adSoyad = adSoyad;
                await user.save();
            } else {
                user = await User.create({
                    adSoyad,
                    email,
                    googleId,
                    avatarUrl
                });
                isNewUser = true;
            }
        } else if (!user.avatarUrl && avatarUrl) {
            user.avatarUrl = avatarUrl;
            await user.save();
        }

        await ensureWelcomeCode(user);
        await syncWelcomeCouponFlag(user);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, COOKIE_OPTIONS);

        res.status(isNewUser ? 201 : 200).json({
            mesaj: isNewUser
                ? `Kayıt başarılı! İlk siparişine özel %${WELCOME_PERCENT} indirim kodun hazır.`
                : 'Giriş başarılı',
            isNewUser,
            kullanici: publicUser(user)
        });
    } catch (error) {
        console.error('Google auth error:', error?.message || error);
        const status = error?.status || 401;
        res.status(status).json({
            mesaj: error?.status ? error.message : 'Google ile giriş başarısız. Lütfen tekrar deneyin.'
        });
    }
};

module.exports = {
    register,
    login,
    googleAuth,
    getMe,
    logout,
    verifyCampaignCode,
    getAllUsers
};
