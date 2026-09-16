//de
const dns = require('dns');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config({ path: path.join(__dirname, '.env') });

dns.setDefaultResultOrder('ipv4first');
if (process.env.DNS_USE_SYSTEM !== '1') {
  const servers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map((item) => item.trim()).filter(Boolean)
    : ['8.8.8.8', '8.8.4.4'];
  if (servers.length) dns.setServers(servers);
}

const connectDB = require('./config/db');

// Veritabanına bağlan
connectDB();

const { corsOrigins, warnProductionConfig } = require('./utils/runtime');
const { configured: mediaConfigured } = require('./utils/mediaStore');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = corsOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Bu origin için CORS izni yok.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

const { uploadRoot } = require('./utils/uploadStore');
// Eski /uploads kayıtları ve site videoları. Yeni yüklemeler Cloudinary'ye gider.
app.use('/uploads', express.static(uploadRoot(), {
  maxAge: '7d',
  fallthrough: true
}));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mesaj: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

// 3. Rotalar (Routes)
app.use('/api/site', require('./routes/siteRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
app.use('/api/ads', require('./routes/adsRoutes'));
app.use('/api/lookbook', require('./routes/lookbookRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/promos', require('./routes/promoRoutes'));
app.use('/api/ateliers', require('./routes/atelierWeekRoutes'));
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
warnProductionConfig();
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda güvenli şekilde çalışıyor...`);
  if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
    console.log('✅ Destek asistanı LLM anahtarı yüklendi');
  }
  if (!mediaConfigured()) {
    console.warn('⚠️  Görsel deposu yok. Yeni yüklemeler diske yazılmaz; Cloudinary anahtarları gerekli.');
  }
});