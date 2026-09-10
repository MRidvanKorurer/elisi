const express = require('express');
const { optionalProtect } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/supportController');

const router = express.Router();
router.post('/chat', optionalProtect, chat);

module.exports = router;
