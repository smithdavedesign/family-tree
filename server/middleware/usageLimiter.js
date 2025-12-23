const { supabase, supabaseAdmin } = require('../db');
const logger = require('../utils/logger');

/**
 * Middleware to check and deduct tokens.
 * Implements "Lazy Refill": Checks if monthly refill is due before deduction.
 * @param {number} requiredTokens 
 */
const checkTokens = (requiredTokens) => {
    return async (req, res, next) => {
        const userId = req.user.id;

        try {
            // 1. Get current balance and subscription
            const { data: balanceData, error: balanceError } = await supabaseAdmin
                .from('token_balances')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (balanceError && balanceError.code !== 'PGRST116') {
                throw balanceError;
            }

            // If no balance record, create one (Free Tier default)
            let currentBalance = balanceData ? balanceData.balance : 50;
            let lastRefill = balanceData ? new Date(balanceData.last_refill_date) : new Date();
            let isNewUser = !balanceData;

            // 2. Check for lazy refill
            const now = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);

            if (isNewUser) {
                // Initialize default
                await supabaseAdmin.from('token_balances').upsert({
                    user_id: userId,
                    balance: 50,
                    last_refill_date: new Date()
                });
            } else if (lastRefill < oneMonthAgo) {
                // Refill needed!
                // Fetch subscription to know 'refill amount'
                const { data: sub } = await supabaseAdmin.from('subscriptions').select('stripe_plan_id, status').eq('user_id', userId).eq('status', 'active').single();

                let refillAmount = 50; // Free
                if (sub && sub.stripe_plan_id.includes('pro')) { // simplistic check
                    refillAmount = 1000;
                }

                currentBalance = refillAmount; // Reset, or add? Usually reset.

                await supabaseAdmin.from('token_balances').update({
                    balance: currentBalance,
                    last_refill_date: now
                }).eq('user_id', userId);

                logger.info('Lazy refill triggered', { userId, currentBalance }, req);
            }

            // 3. Check sufficiency
            if (currentBalance < requiredTokens) {
                return res.status(403).json({
                    error: 'Insufficient tokens',
                    currentBalance,
                    required: requiredTokens,
                    upgradeUrl: '/pricing'
                });
            }

            // 4. Deduct tokens
            const newBalance = currentBalance - requiredTokens;
            const { error: updateError } = await supabaseAdmin
                .from('token_balances')
                .update({ balance: newBalance })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // 5. Log usage (async, don't block)
            supabaseAdmin.from('token_usage_logs').insert({
                user_id: userId,
                amount: requiredTokens,
                action: req.originalUrl,
                feature_name: 'api_usage'
            }).then(({ error }) => {
                if (error) logger.error('Usage log error', error, req);
            });

            // Attach balance to req for downstream use if needed
            req.tokenBalance = newBalance;
            next();

        } catch (error) {
            logger.error('Token check error', error, req);
            res.status(500).json({ error: 'Failed to verify token balance' });
        }
    };
};

module.exports = { checkTokens };
