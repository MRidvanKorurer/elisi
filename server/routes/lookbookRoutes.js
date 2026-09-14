const multer = require('multer');
const express = require('express');
const { protect, superAdmin } = require('../middleware/authMiddleware');
const { listLookbook, createLookbook, updateLookbook, setLookbookPublished, deleteLookbook } = require('../controllers/lookbookController');
const { storeUploaded } = require('../utils/mediaStore');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okVideo = file.fieldname === 'video' && /video\//.test(file.mimetype);
    const okPoster = file.fieldname === 'poster' && /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    if (okVideo || okPoster) return cb(null, true);
    cb(new Error('Geçersiz dosya türü. Video veya görsel yükleyin.'));
  }
});

const router = express.Router();

router.get('/', listLookbook);
router.get('/admin', protect, superAdmin, (req, res) => {
  req.adminAll = true;
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
  storeUploaded('lookbook'),
  createLookbook
);
router.put(
  '/:id',
  protect,
  superAdmin,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
  ]),
  storeUploaded('lookbook'),
  updateLookbook
);
router.patch('/:id/publish', protect, superAdmin, setLookbookPublished);
router.delete('/:id', protect, superAdmin, deleteLookbook);

module.exports = router;
