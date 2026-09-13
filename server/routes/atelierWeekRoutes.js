const express = require('express');
const router = express.Router();
const { getAtelierWeekMeta, listPublicWeek } = require('../controllers/atelierWeekController');

router.get('/week', listPublicWeek);
router.get('/week/meta', getAtelierWeekMeta);

module.exports = router;
