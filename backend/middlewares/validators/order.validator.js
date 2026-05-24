const { body } = require('express-validator');

/**
 * Validation rules for creating an order.
 */
const createOrderValidator = [
    body('type')
        .isIn(['Dine-in', 'Takeaway'])
        .withMessage('Order type must be either Dine-in or Takeaway'),
    
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    
    body('items.*.menuItem')
        .isMongoId()
        .withMessage('Invalid menu item ID'),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    
    body('paymentMethod')
        .optional()
        .isIn(['Cash', 'Card', 'Online'])
        .withMessage('Invalid payment method'),
    
    body('clientPhone')
        .notEmpty()
        .withMessage('Client phone number is required'),
];

/**
 * Validation rules for updating order status.
 */
const updateStatusValidator = [
    body('status')
        .isIn(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'])
        .withMessage('Invalid status value'),
];

module.exports = {
    createOrderValidator,
    updateStatusValidator
};
