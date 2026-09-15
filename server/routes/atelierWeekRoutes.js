const express = require('express');
const router = express.Router();
const { listPublicWeek, listPublicAteliers } = require('../controllers/atelierWeekController');

router.get('/week', listPublicWeek);
router.get('/', listPublicAteliers);

module.exports = router;
