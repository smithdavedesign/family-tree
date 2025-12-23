const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
// webhookController is handled in index.js for proper JSON parsing, but can be here if careful
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Protected Routes
router.post('/subscription/create-checkout', requireAuth, subscriptionController.createCheckoutSession);
router.post('/subscription/portal', requireAuth, subscriptionController.createPortalSession);
router.get('/subscription/status', requireAuth, subscriptionController.getSubscriptionStatus);
router.post('/subscription/redeem', requireAuth, subscriptionController.redeemCoupon);

module.exports = router;
