const path = require('path');
const fs = require('fs');
const multer = require('multer');

const productDir = path.join(__dirname, '../uploads/products');
fs.mkdirSync(productDir, { recursive: true });

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

const publicPath = (file) => (file ? `/uploads/products/${file.filename}` : '');

const removeUpload = (url) => {
  if (!url || !url.startsWith('/uploads/')) return;
  fs.promises.unlink(path.join(__dirname, '..', url)).catch(() => {});
};

module.exports = { productImages, publicPath, removeUpload };
