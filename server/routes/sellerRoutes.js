const express = require('express');
const router = express.Router();
const {
  registerSeller,
  getMySeller,
  updateMySeller,
  getMyOrders,
  getMyOverview
} = require('../controllers/sellerController');
const {
  getMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct
} = require('../controllers/productController');
const { protect, optionalProtect, approvedSeller } = require('../middleware/authMiddleware');
const { productImages } = require('../middleware/uploadMiddleware');

router.post('/register', optionalProtect, registerSeller);
router.get('/me', protect, getMySeller);
router.put('/me', protect, approvedSeller, updateMySeller);
router.get('/me/overview', protect, approvedSeller, getMyOverview);
router.get('/me/orders', protect, approvedSeller, getMyOrders);
router.get('/me/products', protect, approvedSeller, getMyProducts);
router.post('/me/products', protect, approvedSeller, productImages, createMyProduct);
router.put('/me/products/:id', protect, approvedSeller, updateMyProduct);
router.delete('/me/products/:id', protect, approvedSeller, deleteMyProduct);

module.exports = router;
