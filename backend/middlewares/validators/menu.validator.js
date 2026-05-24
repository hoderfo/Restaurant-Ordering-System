const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Error:", errors.array());
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: errors.array()
        });
    }
    next();
};

const validateCategory = [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    handleValidationErrors
];

const validateMenuItem = [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isMongoId().withMessage('Invalid Category ID'),
    handleValidationErrors
];

module.exports = { validateCategory, validateMenuItem };
