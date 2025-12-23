const { supabase, supabaseAdmin } = require('../db');
const stripeService = require('../services/stripeService');
const logger = require('../utils/logger');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const userId = req.user.id;
    const email = req.user.email;
    const name = req.user.user_metadata?.full_name || email;

    // Lookup Stripe Price ID
    const plan = stripeService.PLAN_MAPPING[priceId];
    if (!plan || !plan.stripePriceId) {
        return res.status(400).json({ error: 'Invalid price ID or missing configuration' });
    }
    const stripePriceId = plan.stripePriceId;

    try {
        // Get user to check for stripe_customer_id
        // Use admin client to ensure we can read the user record regardless of RLS
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        let stripeCustomerId = user.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            stripeCustomerId = await stripeService.createStripeCustomer(email, userId, name);
            // Save to DB
            await supabaseAdmin.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('id', userId);
        }

        const baseUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173');
        if (!baseUrl) {
            logger.error('CLIENT_URL environment variable is missing for Stripe redirect', {}, req);
            return res.status(500).json({ error: 'Server configuration error: missing CLIENT_URL' });
        }
        const returnUrl = `${baseUrl}/settings`;



        const sessionUrl = await stripeService.createCheckoutSession(stripeCustomerId, stripePriceId, returnUrl);

        res.json({ url: sessionUrl });

    } catch (error) {
        logger.error('Create checkout session error', error, req);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

const createPortalSession = async (req, res) => {
    const userId = req.user.id;

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (error || !user.stripe_customer_id) {
            return res.status(400).json({ error: 'No billing account found' });
        }

        const baseUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173');
        if (!baseUrl) {
            logger.error('CLIENT_URL environment variable is missing for Stripe portal redirect', {}, req);
            return res.status(500).json({ error: 'Server configuration error: missing CLIENT_URL' });
        }
        const returnUrl = `${baseUrl}/settings`;

        const url = await stripeService.createPortalSession(user.stripe_customer_id, returnUrl);

        res.json({ url });

    } catch (error) {
        logger.error('Create portal session error', error, req);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
};

const getSubscriptionStatus = async (req, res) => {
    const userId = req.user.id;

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Parallel fetch for sub + tokens
        const [subResult, tokenResult] = await Promise.all([
            supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId),
            supabaseAdmin.from('token_balances').select('*').eq('user_id', userId).single()
        ]);

        let subscription = null;
        if (subResult.data && subResult.data.length > 0) {
            // Prefer active, then taking the most recent one
            const activeSub = subResult.data.find(s => s.status === 'active' || s.status === 'trialing');
            subscription = activeSub || subResult.data[0];
        }

        if (subResult.error) logger.error('Sub Fetch Error', subResult.error, req);

        const tokens = tokenResult.data || { balance: 0 }; // might be null if new user

        // Identify internal plan ID
        let planTier = 'free';
        let currentPlan = 'price_free';

        if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
            // Map Stripe Price ID back to internal plan ID
            const priceId = subscription.stripe_plan_id;

            if (priceId === stripeService.priceMonthly) {
                planTier = 'pro';
                currentPlan = 'price_pro_monthly';
            } else if (priceId === stripeService.priceYearly) {
                planTier = 'pro';
                currentPlan = 'price_pro_yearly';
            } else {
                planTier = 'pro'; // Default for unknown paid plans
                currentPlan = priceId;
            }
        }

        res.json({
            subscription,
            tokens: tokens.balance,
            plan: planTier,
            currentPlan: currentPlan
        });

    } catch (error) {
        logger.error('Error fetching subscription status', error, req);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
};

const redeemCoupon = async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    if (code !== process.env.FAMILY_SECRET_CODE) {
        logger.warn('Invalid coupon attempt', { userId, code }, req);
        return res.status(403).json({ error: 'Invalid coupon code' });
    }

    const grantAmount = parseInt(process.env.FAMILY_GRANT_AMOUNT || '1000', 10);

    try {
        // 1. Get current balance
        const { data: balanceData, error: balanceError } = await supabaseAdmin
            .from('token_balances')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

        const currentBalance = balanceData ? balanceData.balance : 0;
        const newBalance = currentBalance + grantAmount;

        // 2. Upsert new balance
        const { error: updateError } = await supabaseAdmin
            .from('token_balances')
            .upsert({
                user_id: userId,
                balance: newBalance,
                last_refill_date: new Date(),
                updated_at: new Date()
            }, { onConflict: 'user_id' });

        if (updateError) throw updateError;

        // 3. Log usage
        await supabaseAdmin.from('token_usage_logs').insert({
            user_id: userId,
            amount: grantAmount,
            action: 'coupon_redeem',
            feature_name: 'marketing',
            metadata: { code_used: 'FAMILY_SECRET' }
        });

        logger.info('Coupon redeemed', { userId, grantAmount }, req);

        res.json({ success: true, newBalance, message: `Redeemed! +${grantAmount} tokens` });

    } catch (error) {
        logger.error('Coupon redemption error', error, req);
        res.status(500).json({ error: 'Failed to redeem coupon' });
    }
};

module.exports = {
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    redeemCoupon
};
