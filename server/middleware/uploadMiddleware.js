const multer = require('multer');
const { storeUploaded } = require('../utils/mediaStore');
const { removeUpload } = require('../utils/uploadStore');

const allowImage = (_req, file, cb) => {
  const name = String(file.originalname || '').toLowerCase();
  if (file.mimetype === 'image/svg+xml' || name.endsWith('.svg')) {
    return cb(new Error('SVG dosyaları kabul edilmiyor.'));
  }
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Yalnızca görsel dosyaları yükleyebilirsiniz.'));
};

const memory = multer.memoryStorage();

const afterUpload = (uploader, folder) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) return next(err);
    storeUploaded(folder)(req, res, next);
  });
};

const productImages = afterUpload(
  multer({
    storage: memory,
    limits: { fileSize: 8 * 1024 * 1024, files: 7 },
    fileFilter: allowImage
  }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 6 }
  ]),
  'products'
);

const categoryImage = afterUpload(
  multer({
    storage: memory,
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: allowImage
  }).single('image'),
  'categories'
);

const reviewPhotos = afterUpload(
  multer({
    storage: memory,
    limits: { fileSize: 8 * 1024 * 1024, files: 4 },
    fileFilter: allowImage
  }).array('photos', 4),
  'reviews'
);

const avatarImage = afterUpload(
  multer({
    storage: memory,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: allowImage
  }).single('avatar'),
  'avatars'
);

const receiptUpload = multer({
  storage: memory,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    if (name.endsWith('.svg') || file.mimetype === 'image/svg+xml') {
      return cb(new Error('SVG dekont kabul edilmiyor.'));
    }
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) || file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(new Error('Dekont için görsel veya PDF yükleyin.'));
  }
});

const receiptFile = (req, res, next) => {
  receiptUpload.single('receipt')(req, res, (err) => {
    if (err) return res.status(400).json({ mesaj: err.message || 'Dekont yüklenemedi.' });
    storeUploaded('receipts')(req, res, next);
  });
};

const storedUrl = (file) => file?.storedUrl || '';

module.exports = {
  productImages,
  categoryImage,
  reviewPhotos,
  avatarImage,
  receiptFile,
  publicPath: storedUrl,
  categoryPublicPath: storedUrl,
  reviewPublicPath: storedUrl,
  avatarPublicPath: storedUrl,
  receiptPublicPath: storedUrl,
  removeUpload
};
