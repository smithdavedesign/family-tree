/**
 * Request Logging Middleware
 * 
 * Logs all HTTP requests with:
 * - Request details (method, URL, headers)
 * - Response details (status code, duration)
 * - User context (if authenticated)
 * - Unique request ID for tracing
 */

const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Generate unique request ID
 */
function generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
    // Add unique request ID
    req.id = generateRequestId();

    // Record start time
    const startTime = Date.now();

    // Create child logger with request context
    req.logger = logger.child({
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
    });

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error('HTTP Request Failed', null, {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                userId: req.user?.id,
                requestId: req.id,
            });
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP Request Client Error', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userId: req.user?.id,
                requestId: req.id,
            });
        } else {
            logger.debug('HTTP Request Completed', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                userId: req.user?.id,
                requestId: req.id,
            });
        }
    });

    next();
}

module.exports = requestLogger;
