const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Global error handling middleware.
 * Catches all errors and formats them into a standard JSON response.
 */
const errorHandler = (err, req, res, _next) => {
    let error = err;

    // Check if error is an instance of ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, [], err.stack);
    }

    // Capture sever errors to Winston for structured JSON logs in Vercel
    if (error.statusCode === 500 || process.env.NODE_ENV === 'development') {
        logger.error(`[API Error] ${error.message}`, {
            path: req.originalUrl,
            method: req.method,
            stack: error.stack,
        });
    }

    const response = {
        success: false,
        message: error.message,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    return res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
