
const dns = require('dns');
// DNS çözümleme sırasını ve sunucularını ayarla (MongoDB Atlas SRV engelleri için)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // SADECE 1 KERE TANIMLANMALI
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db'); // Veritabanı bağlantı dosyanız

// Çevre değişkenlerini yükle (her zaman server/.env)
dotenv.config({ path: path.join(__dirname, '.env') });

// Veritabanına bağlan
connectDB();

const app = express();

// 1. CORS Ayarı (Credentials & Origin Koruması)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// 2. Middleware'ler
app.use(express.json()); // JSON gövdelerini okumak için
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // HttpOnly Cookie'leri okumak için

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// 3. Rotalar (Routes)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
app.use('/api/ads', require('./routes/adsRoutes'));
app.use('/api/lookbook', require('./routes/lookbookRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/promos', require('./routes/promoRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// Arama motorları için güncel sitemap ve robots dosyaları
app.use('/', require('./routes/seoRoutes'));

// 4. Hata yakalayıcı (dosya yükleme ve rota hataları JSON döner)
app.use((err, req, res, next) => {
  if (!err) return next();
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
  return res.status(status).json({ mesaj: err.message || 'İstek işlenemedi.' });
});

// 5. Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda güvenli şekilde çalışıyor...`);
  if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
    console.log('✅ Destek asistanı LLM anahtarı yüklendi');
  }
});