const Stripe = require('stripe');
require('dotenv').config();

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const priceMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
const priceYearly = process.env.STRIPE_PRICE_PRO_YEARLY;

const stripe = new Stripe(stripeKey);

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY is missing.');
}

const PLAN_MAPPING = {
    'price_free': { id: 'price_free', name: 'Free', tokens: 50 },
    'price_pro_monthly': { id: 'price_pro_monthly', name: 'Pro Monthly', tokens: 1000, stripePriceId: priceMonthly },
    'price_pro_yearly': { id: 'price_pro_yearly', name: 'Pro Yearly', tokens: 12000, stripePriceId: priceYearly },
};

/**
 * Create a Stripe customer for a user
 * @param {string} email 
 * @param {string} userId 
 * @param {string} name 
 * @returns {Promise<string>} stripeCustomerId
 */
const createStripeCustomer = async (email, userId, name) => {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                userId: userId
            }
        });
        return customer.id;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
};

/**
 * Create a checkout session for upgrading to a paid plan
 * @param {string} stripeCustomerId 
 * @param {string} priceId 
 * @param {string} returnUrl 
 * @returns {Promise<string>} sessionUrl
 */
const createCheckoutSession = async (stripeCustomerId, priceId, returnUrl) => {
    try {
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
        });
        return session.url;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

/**
 * Create a billing portal session for managing subscriptions
 * @param {string} stripeCustomerId 
 * @param {string} returnUrl 
 * @returns {Promise<string>} sessionUrl
 */
const createPortalSession = async (stripeCustomerId, returnUrl) => {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: returnUrl,
        });
        return session.url;
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
};

module.exports = {
    stripe,
    PLAN_MAPPING,
    webhookSecret,
    priceMonthly,
    priceYearly,
    createStripeCustomer,
    createCheckoutSession,
    createPortalSession
};
