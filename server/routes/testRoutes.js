const express = require('express');
const router = express.Router();
const { captureException, captureMessage } = require('../utils/errorLogger');

/**
 * Test endpoint to verify error tracking
 * GET /api/test/error
 */
router.get('/error', (req, res) => {
    try {
        // Intentionally throw an error to test logging
        throw new Error('Test Error - Backend');
    } catch (error) {
        // Capture the error
        captureException(error, {
            endpoint: '/api/test/error',
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            message: 'Error logged to console',
            error: error.message
        });
    }
});

/**
 * Test endpoint to verify message tracking
 * GET /api/test/message
 */
router.get('/message', (req, res) => {
    captureMessage('Test Message - Backend', 'info', {
        endpoint: '/api/test/message',
        timestamp: new Date().toISOString()
    });

    res.json({
        message: 'Message logged to console'
    });
});

/**
 * Health check endpoint
 * GET /api/test/health
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        logging: 'console-based (free)'
    });
});

module.exports = router;
