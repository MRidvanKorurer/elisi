const express = require('express');
const router = express.Router();
const { protect, superAdmin } = require('../middleware/authMiddleware');
const { productImages, categoryImage } = require('../middleware/uploadMiddleware');
const {
  getOverview,
  listUsers,
  updateUserRole,
  listSellers,
  updateSellerStatus,
  listProducts,
  updateProduct,
  deleteProduct,
  setProductApproval,
  listOrders,
  updateOrder,
  listCategories,
  updateCategory
} = require('../controllers/adminController');
const { listPromos, createPromo, updatePromo, deletePromo } = require('../controllers/promoController');

router.use(protect, superAdmin);

router.get('/overview', getOverview);
router.get('/orders', listOrders);
router.put('/orders/:id', updateOrder);
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/sellers', listSellers);
router.put('/sellers/:id/status', updateSellerStatus);
router.get('/products', listProducts);
router.put('/products/:id', productImages, updateProduct);
router.put('/products/:id/approval', setProductApproval);
router.delete('/products/:id', deleteProduct);
router.get('/categories', listCategories);
router.put('/categories/:id', categoryImage, updateCategory);
router.get('/promos', listPromos);
router.post('/promos', createPromo);
router.put('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

module.exports = router;
