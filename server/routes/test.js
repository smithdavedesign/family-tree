const express = require('express');
const router = express.Router();
const { captureException, captureMessage } = require('../utils/sentry');

/**
 * Test endpoint to verify Sentry error tracking
 * GET /api/test/sentry-error
 */
router.get('/sentry-error', (req, res) => {
    try {
        // Intentionally throw an error to test Sentry
        throw new Error('Test Sentry Error - Backend');
    } catch (error) {
        // Capture the error with Sentry
        captureException(error, {
            endpoint: '/api/test/sentry-error',
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            message: 'Error sent to Sentry',
            error: error.message
        });
    }
});

/**
 * Test endpoint to verify Sentry message tracking
 * GET /api/test/sentry-message
 */
router.get('/sentry-message', (req, res) => {
    captureMessage('Test Sentry Message - Backend', 'info', {
        endpoint: '/api/test/sentry-message',
        timestamp: new Date().toISOString()
    });

    res.json({
        message: 'Message sent to Sentry'
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
        sentry: process.env.SENTRY_DSN ? 'configured' : 'not configured'
    });
});

module.exports = router;
