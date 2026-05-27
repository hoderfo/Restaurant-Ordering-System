const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticateToken } = require('../middleware/auth'); // Require login to view menu (assuming staff only for now)

router.get('/', authenticateToken, menuController.getMenuItems);

module.exports = router;
