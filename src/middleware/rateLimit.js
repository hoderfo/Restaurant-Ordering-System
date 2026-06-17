const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  skip: (req) => {
    return req.path === '/health';
  }
});

// Stricter limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

// Analytics limiter
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many analytics requests, please try again later'
});

module.exports = {
  apiLimiter,
  loginLimiter,
  analyticsLimiter
};
