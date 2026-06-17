const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');

// All order routes require auth
router.use(authenticateToken);

// Floor plan endpoints
router.post('/', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.getOrCreateOrder);
router.get('/table/:tableId', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.getTableOrderItems);
router.post('/:orderId/items', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.addItemToOrder);

// Billing endpoints
router.post('/:orderId/checkout', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.checkoutOrder);
router.get('/:orderId/bill', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.getBill);

// Kitchen endpoints
// Allow 'kitchen', 'admin', 'management' to access kitchen routes
router.get('/kitchen', requireRole(ROLES.KITCHEN_AND_MANAGEMENT), orderController.getKitchenOrders);
router.put('/items/:itemId/status', requireRole(ROLES.KITCHEN_AND_MANAGEMENT), orderController.updateOrderItemStatus);

module.exports = router;
