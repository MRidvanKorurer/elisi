const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Model yolunu kendi projene göre ayarla

const getToken = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

exports.protect = async (req, res, next) => {
  const token = getToken(req);

  // 2. Token yoksa HATA ver
  if (!token) {
    return res.status(401).json({ mesaj: 'Yetkisiz erişim, token bulunamadı.' });
  }

  try {
    // 3. Token'ı çöz (JWT_SECRET kelimesini kendi .env dosyana göre yaz)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Kullanıcıyı bul ve req.user içine ekle (Şifreyi hariç tut)
    req.user = await User.findById(decoded.id).select('-sifre');
    
    next(); // İşleme devam et
  } catch (error) {
    console.error("Token Doğrulama Hatası:", error);
    return res.status(401).json({ mesaj: 'Yetkisiz erişim, geçersiz token.' });
  }
};

// Checkout misafirlere açık; token varsa siparişi kullanıcıya bağla
exports.optionalProtect = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-sifre');
  } catch (error) {
    req.user = null;
  }

  next();
};

exports.admin = async (req, res, next) => {
    // Veritabanı modelinizde admin'leri belirten bir 'isAdmin' veya 'role' alanı olduğunu varsayıyoruz
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: "Erişim reddedildi. Bu işlem için Admin (Yönetici) yetkisi gerekiyor." 
        });
    }
};