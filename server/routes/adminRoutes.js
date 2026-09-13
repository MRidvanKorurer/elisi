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
  updateSellerCommission,
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
const { listAdminFeatured, reviewFeatured, removeFeatured, giftFeatured, updateFeaturedSettings } = require('../controllers/featuredController');
const { listAdminWeek, reviewWeek, removeWeek, giftWeek } = require('../controllers/atelierWeekController');
const { getAdminReports, getAdminSellerReport } = require('../controllers/adminReportsController');

router.use(protect, superAdmin);

router.get('/overview', getOverview);
router.get('/reports', getAdminReports);
router.get('/reports/sellers/:sellerId', getAdminSellerReport);
router.get('/orders', listOrders);
router.put('/orders/:id', updateOrder);
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/sellers', listSellers);
router.put('/sellers/:id/status', updateSellerStatus);
router.put('/sellers/:id/commission', updateSellerCommission);
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
router.get('/featured', listAdminFeatured);
router.put('/featured/settings', updateFeaturedSettings);
router.post('/featured/gift', giftFeatured);
router.put('/featured/:id/remove', removeFeatured);
router.put('/featured/:id', reviewFeatured);
router.get('/atelier-week', listAdminWeek);
router.post('/atelier-week/gift', giftWeek);
router.put('/atelier-week/:id/remove', removeWeek);
router.put('/atelier-week/:id', reviewWeek);

module.exports = router;
