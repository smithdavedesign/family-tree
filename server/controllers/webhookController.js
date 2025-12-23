const { supabaseAdmin } = require('../db');
const { stripe } = require('../services/stripeService');
const logger = require('../utils/logger');

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed', err, req);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
                logger.info('Unhandled Stripe event', { type: event.type }, req);
        }
        res.json({ received: true });
    } catch (err) {
        logger.error('Error processing webhook', err, req);
        res.status(500).send('Server Error');
    }
};

const handleCheckoutSessionCompleted = async (session) => {
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer;
    const subscriptionId = session.subscription;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    let planTier = 'free';
    let tokensToGrant = 50;

    logger.debug('Webhook Plan Matching', { priceId, monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, yearly: process.env.STRIPE_PRICE_PRO_YEARLY });

    if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
        planTier = 'pro';
        tokensToGrant = 1000;
        logger.info('Matched Monthly Plan');
    } else if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
        planTier = 'pro';
        tokensToGrant = 12000;
        logger.info('Matched Yearly Plan');
    } else {
        logger.warn('No plan match found for priceId', { priceId });
    }

    // Upsert Subscription
    const targetUserId = userId || await getUserIdByStripeId(stripeCustomerId);

    if (!targetUserId) {
        logger.error('Could not find user for webhook', { stripeCustomerId });
        return;
    }

    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
            stripe_subscription_id: subscriptionId,
            user_id: targetUserId,
            stripe_plan_id: priceId,
            status: subscription.status,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
        }, { onConflict: 'stripe_subscription_id' });

    if (subError) logger.error('Error upserting subscription', subError);

    // Refill Tokens
    const { error: tokenError } = await supabaseAdmin.from('token_balances').upsert({
        user_id: targetUserId,
        balance: tokensToGrant,
        last_refill_date: new Date(),
        updated_at: new Date()
    }, { onConflict: 'user_id' });

    if (tokenError) logger.error('Error refilling tokens', tokenError);

    logger.info('Subscription activated', { targetUserId, stripeCustomerId });
};

const handleInvoicePaymentSucceeded = async (invoice) => {
    if (invoice.billing_reason === 'subscription_create') {
        return;
    }

    const stripeCustomerId = invoice.customer;
    logger.info('Payment succeeded', { stripeCustomerId, billing_reason: invoice.billing_reason });

    const userId = await getUserIdByStripeId(stripeCustomerId);
    if (!userId) return;

    await supabaseAdmin.from('token_balances').update({
        balance: 1000,
        last_refill_date: new Date(),
        updated_at: new Date()
    }).eq('user_id', userId);
};

const handleSubscriptionDeleted = async (subscription) => {
    const stripeCustomerId = subscription.customer;
    const userId = await getUserIdByStripeId(stripeCustomerId);

    if (!userId) return;

    await supabaseAdmin.from('subscriptions').update({
        status: 'canceled',
        updated_at: new Date()
    }).eq('stripe_subscription_id', subscription.id);

    logger.info('Subscription canceled', { stripeCustomerId });
};

async function getUserIdByStripeId(stripeCustomerId) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

    if (error || !data) {
        logger.error('Could not find user for stripe customer', error, { stripeCustomerId });
        return null;
    }
    return data.id;
}

module.exports = { handleStripeWebhook };
