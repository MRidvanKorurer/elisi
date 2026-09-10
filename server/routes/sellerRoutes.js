const express = require('express');
const router = express.Router();
const {
  registerSeller,
  getMySeller,
  updateMySeller,
  getMyOrders,
  updateMyOrder,
  getMyOverview,
  getPublicSeller
} = require('../controllers/sellerController');
const {
  getMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct
} = require('../controllers/productController');
const {
  listMyPromos,
  createMyPromo,
  updateMyPromo,
  deleteMyPromo
} = require('../controllers/promoController');
const { protect, optionalProtect, approvedSeller } = require('../middleware/authMiddleware');
const { productImages } = require('../middleware/uploadMiddleware');

router.post('/register', optionalProtect, registerSeller);
router.get('/public/:slug', getPublicSeller);
router.get('/me', protect, getMySeller);
router.put('/me', protect, approvedSeller, updateMySeller);
router.get('/me/overview', protect, approvedSeller, getMyOverview);
router.get('/me/orders', protect, approvedSeller, getMyOrders);
router.put('/me/orders/:id', protect, approvedSeller, updateMyOrder);
router.get('/me/products', protect, approvedSeller, getMyProducts);
router.post('/me/products', protect, approvedSeller, productImages, createMyProduct);
router.put('/me/products/:id', protect, approvedSeller, productImages, updateMyProduct);
router.delete('/me/products/:id', protect, approvedSeller, deleteMyProduct);
router.get('/me/promos', protect, approvedSeller, listMyPromos);
router.post('/me/promos', protect, approvedSeller, createMyPromo);
router.put('/me/promos/:id', protect, approvedSeller, updateMyPromo);
router.delete('/me/promos/:id', protect, approvedSeller, deleteMyPromo);

module.exports = router;
