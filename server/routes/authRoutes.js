const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, logout, verifyCampaignCode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/verify-campaign', protect, verifyCampaignCode);

module.exports = router;