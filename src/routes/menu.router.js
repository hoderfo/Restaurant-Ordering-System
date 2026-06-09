const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticateToken } = require('../middleware/auth'); // Require login to view menu (assuming staff only for now)
const { requireRole, ROLES } = require('../middleware/rbac');

router.get('/', authenticateToken, menuController.getMenuItems);
router.post('/', authenticateToken, requireRole(ROLES.MANAGEMENT), menuController.createMenuItem);
router.put('/:id', authenticateToken, requireRole(ROLES.MANAGEMENT), menuController.updateMenuItem);
router.delete('/:id', authenticateToken, requireRole(ROLES.MANAGEMENT), menuController.deleteMenuItem);

module.exports = router;
