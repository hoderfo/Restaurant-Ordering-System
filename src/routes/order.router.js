const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');

// All order routes require auth
router.use(authenticateToken);

// Floor plan endpoints
router.post('/', orderController.getOrCreateOrder);
router.get('/table/:tableId', orderController.getTableOrderItems);
router.post('/:orderId/items', orderController.addItemToOrder);

// Billing endpoints
router.post('/:orderId/checkout', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.checkoutOrder);
router.get('/:orderId/bill', requireRole(ROLES.FLOOR_AND_MANAGEMENT), orderController.getBill);

// Kitchen endpoints
// Allow 'kitchen', 'admin', 'management' to access kitchen routes
router.get('/kitchen', requireRole(['kitchen', 'admin', 'management']), orderController.getKitchenOrdersSafe);
router.put('/items/:itemId/status', orderController.updateOrderItemStatus);

module.exports = router;
