const path = require('path');
const fs = require('fs');
const multer = require('multer');

const productDir = path.join(__dirname, '../uploads/products');
const categoryDir = path.join(__dirname, '../uploads/categories');
const reviewDir = path.join(__dirname, '../uploads/reviews');
const avatarDir = path.join(__dirname, '../uploads/avatars');
fs.mkdirSync(productDir, { recursive: true });
fs.mkdirSync(categoryDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });
fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 7 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Yalnızca görsel dosyaları yükleyebilirsiniz.'));
  }
});

// Ana görsel + galeri alanlarını tek seferde alır
const productImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 6 }
]);

const categoryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, categoryDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Yalnızca görsel dosyaları yükleyebilirsiniz.'));
  }
});

const categoryImage = categoryUpload.single('image');

const reviewStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, reviewDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const reviewUpload = multer({
  storage: reviewStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Yalnızca görsel dosyaları yükleyebilirsiniz.'));
  }
});

const reviewPhotos = reviewUpload.array('photos', 4);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Yalnızca görsel dosyaları yükleyebilirsiniz.'));
  }
});

const avatarImage = avatarUpload.single('avatar');

const receiptDir = path.join(__dirname, '../uploads/receipts');
fs.mkdirSync(receiptDir, { recursive: true });

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype) || file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Dekont için görsel veya PDF yükleyin.'));
  }
});

const receiptFile = (req, res, next) => {
  receiptUpload.single('receipt')(req, res, (err) => {
    if (err) return res.status(400).json({ mesaj: err.message || 'Dekont yüklenemedi.' });
    next();
  });
};

const publicPath = (file) => (file ? `/uploads/products/${file.filename}` : '');
const categoryPublicPath = (file) => (file ? `/uploads/categories/${file.filename}` : '');
const reviewPublicPath = (file) => (file ? `/uploads/reviews/${file.filename}` : '');
const avatarPublicPath = (file) => (file ? `/uploads/avatars/${file.filename}` : '');
const receiptPublicPath = (file) => (file ? `/uploads/receipts/${file.filename}` : '');

const removeUpload = (url) => {
  if (!url || !url.startsWith('/uploads/')) return;
  fs.promises.unlink(path.join(__dirname, '..', url)).catch(() => {});
};

module.exports = {
  productImages,
  categoryImage,
  reviewPhotos,
  avatarImage,
  receiptFile,
  publicPath,
  categoryPublicPath,
  reviewPublicPath,
  avatarPublicPath,
  receiptPublicPath,
  removeUpload
};
