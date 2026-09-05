const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Model yolunu kendi projene göre ayarla

exports.protect = async (req, res, next) => {
  let token;

  // 1. Token'ı HTTP-Only Cookie'den alıyoruz (Senin projenin mimarisi bu)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // (Opsiyonel) Eğer Bearer header ile gelirse diye yedek seçenek
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Token yoksa HATA ver
  if (!token) {
    return res.status(401).json({ mesaj: 'Yetkisiz erişim, token bulunamadı.' });
  }

  try {
    // 3. Token'ı çöz (JWT_SECRET kelimesini kendi .env dosyana göre yaz)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Kullanıcıyı bul ve req.user içine ekle (Şifreyi hariç tut)
    req.user = await User.findById(decoded.id).select('-password');
    
    next(); // İşleme devam et
  } catch (error) {
    console.error("Token Doğrulama Hatası:", error);
    return res.status(401).json({ mesaj: 'Yetkisiz erişim, geçersiz token.' });
  }
};