const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { recordEvents } = require('../controllers/adsController');

router.post('/events', optionalProtect, recordEvents);

module.exports = router;
