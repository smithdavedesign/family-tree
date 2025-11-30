const rateLimit = require('express-rate-limit');

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict limiter for authentication endpoints - 5 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate limiter for write operations - 30 requests per 15 minutes
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many write requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for account deletion - 2 requests per hour
const accountDeletionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: 'Too many account deletion attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    writeLimiter,
    accountDeletionLimiter
};
