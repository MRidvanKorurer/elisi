
const dns = require('dns');
// DNS çözümleme sırasını ve sunucularını ayarla (MongoDB Atlas SRV engelleri için)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // SADECE 1 KERE TANIMLANMALI
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db'); // Veritabanı bağlantı dosyanız

// Çevre değişkenlerini yükle
dotenv.config();

// Veritabanına bağlan
connectDB();

const app = express();

// 1. CORS Ayarı (Credentials & Origin Koruması)
app.use(cors({
  origin: 'http://localhost:5173', // React/Vite uygulamanızın adresi
  credentials: true // HttpOnly Cookie iletimi için ZORUNLU
}));

// 2. Middleware'ler
app.use(express.json()); // JSON gövdelerini okumak için
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // HttpOnly Cookie'leri okumak için

// 3. Rotalar (Routes)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 4. Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda güvenli şekilde çalışıyor...`);
});