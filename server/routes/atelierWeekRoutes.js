const express = require('express');
const router = express.Router();
const { listPublicWeek } = require('../controllers/atelierWeekController');

router.get('/week', listPublicWeek);

module.exports = router;
