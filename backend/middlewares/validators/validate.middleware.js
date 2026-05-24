const { validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

/**
 * Generic validation middleware that checks for express-validator results.
 * Throws an ApiError if validation fails.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = [];
        errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));
        
        throw new ApiError(400, "Validation Failed", extractedErrors);
    }
    next();
};

module.exports = validate;
