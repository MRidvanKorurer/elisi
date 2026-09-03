const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, verifyCampaignCode, getAllUsers } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/verify-campaign', verifyCampaignCode);
router.get('/users', getAllUsers);

module.exports = router;