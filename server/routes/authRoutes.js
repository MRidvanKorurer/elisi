const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, verifyCampaignCode, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/verify-campaign', protect, verifyCampaignCode);
router.get('/users', getAllUsers);

module.exports = router;