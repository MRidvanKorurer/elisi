const express = require('express');
const router = express.Router();
const { registerSeller, getMySeller } = require('../controllers/sellerController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/register', optionalProtect, registerSeller);
router.get('/me', protect, getMySeller);

module.exports = router;
