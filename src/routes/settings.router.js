const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');

// Public settings (accessible without authentication)
router.get('/public', settingController.getPublicSettings);

module.exports = router;
