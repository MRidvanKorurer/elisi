const path = require('path');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const { protect, superAdmin } = require('../middleware/authMiddleware');
const { listLookbook, createLookbook, deleteLookbook } = require('../controllers/lookbookController');

const lookbookDir = path.join(__dirname, '../uploads/lookbook');
fs.mkdirSync(lookbookDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, lookbookDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okVideo = file.fieldname === 'video' && /video\//.test(file.mimetype);
    const okPoster = file.fieldname === 'poster' && /image\//.test(file.mimetype);
    if (okVideo || okPoster) return cb(null, true);
    cb(new Error('Geçersiz dosya türü. Video veya görsel yükleyin.'));
  }
});

const router = express.Router();

router.get('/', listLookbook);
router.get('/admin', protect, superAdmin, (req, res) => {
  req.query.all = '1';
  return listLookbook(req, res);
});
router.post(
  '/',
  protect,
  superAdmin,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
  ]),
  createLookbook
);
router.delete('/:id', protect, superAdmin, deleteLookbook);

module.exports = router;
