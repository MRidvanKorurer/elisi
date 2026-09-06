const express = require('express');
const router = express.Router();
const { protect, superAdmin } = require('../middleware/authMiddleware');
const { productImages } = require('../middleware/uploadMiddleware');
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
  updateOrder
} = require('../controllers/adminController');

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

module.exports = router;
