const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const googleOAuthController = require('../controllers/googleOAuthController');

// Initiate Google OAuth connection
// Redirects user to Google consent screen
router.get('/connect', requireAuth, googleOAuthController.initiateConnection);

// OAuth callback from Google
// No auth required (handled by state parameter)
router.get('/callback', googleOAuthController.handleCallback);

// Get connection status for current user
router.get('/status', requireAuth, googleOAuthController.getConnectionStatus);

// Get valid access token (auto-refreshes if needed)
// Used by pickers to get current token
router.get('/token', requireAuth, googleOAuthController.getValidToken);

// Manually refresh token
router.post('/refresh', requireAuth, googleOAuthController.refreshToken);

// Disconnect Google account
router.post('/disconnect', requireAuth, googleOAuthController.disconnect);

module.exports = router;
