const express = require('express');
const router = express.Router();
const { createOrder, iyzicoCallback, getMyOrders, getOrderById, addOrderNote, getGuestOrderThread, addGuestOrderNote } = require('../controllers/orderController');



const { protect, optionalProtect } = require('../middleware/authMiddleware');


router.post('/create', optionalProtect, createOrder);
router.post('/payment/callback', iyzicoCallback);
router.get('/payment/callback', iyzicoCallback); 

router.get('/guest/:id', getGuestOrderThread);
router.post('/guest/:id/notes', addGuestOrderNote);
router.get('/myorders', protect, getMyOrders);
router.get('/myorders/:id', protect, getOrderById);
router.post('/myorders/:id/notes', protect, addOrderNote);

module.exports = router;