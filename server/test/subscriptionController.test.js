const { describe, it, expect, beforeEach, vi } = require('@jest/globals');

// Helper to create a fluent mock chain
const createChain = () => {
    const chain = {};
    chain.from = jest.fn(() => chain);
    chain.select = jest.fn(() => chain);
    chain.insert = jest.fn(() => chain);
    chain.update = jest.fn(() => chain);
    chain.upsert = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.single = jest.fn(() => chain);
    chain.order = jest.fn(() => chain);
    chain.limit = jest.fn(() => chain);
    return chain;
};

const mockSupabaseAdmin = createChain();

jest.mock('../db', () => ({
    supabase: {},
    supabaseAdmin: mockSupabaseAdmin
}));

jest.mock('../services/stripeService', () => ({
    PLAN_MAPPING: {
        'price_pro_monthly': { stripePriceId: 'stripe-monthly' }
    },
    createStripeCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn()
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const subscriptionController = require('../controllers/subscriptionController');

describe('Subscription Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'test-user-id', email: 'test@example.com' },
            body: {},
            params: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn(() => res)
        };
        jest.clearAllMocks();
        process.env.FAMILY_SECRET_CODE = 'secret123';
        process.env.FAMILY_GRANT_AMOUNT = '1000';
        process.env.STRIPE_PRICE_PRO_MONTHLY = 'stripe-monthly';
        process.env.STRIPE_PRICE_PRO_YEARLY = 'stripe-yearly';
    });

    describe('redeemCoupon', () => {
        it('should redeem coupon with correct code', async () => {
            req.body.code = 'secret123';

            // Mock current balance fetch
            mockSupabaseAdmin.single.mockResolvedValueOnce({
                data: { balance: 50 },
                error: null
            });

            // Mock balance update
            mockSupabaseAdmin.upsert.mockResolvedValueOnce({ error: null });

            // Mock usage log
            mockSupabaseAdmin.insert.mockResolvedValueOnce({ error: null });

            await subscriptionController.redeemCoupon(req, res);

            expect(mockSupabaseAdmin.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'test-user-id',
                    balance: 1050
                }),
                expect.any(Object)
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                newBalance: 1050
            }));
        });
    });

    describe('getSubscriptionStatus', () => {
        it('should return correct status for pro user', async () => {
            // Re-mock from to return different chains for concurrent calls
            const subChain = createChain();
            const tokenChain = createChain();
            const userChain = createChain();

            mockSupabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') return userChain;
                if (table === 'subscriptions') return subChain;
                if (table === 'token_balances') return tokenChain;
                return createChain();
            });

            userChain.single.mockResolvedValueOnce({
                data: { stripe_customer_id: 'cus_123' },
                error: null
            });

            subChain.eq.mockResolvedValueOnce({
                data: [{ status: 'active', stripe_plan_id: 'stripe-monthly' }],
                error: null
            });

            tokenChain.single.mockResolvedValueOnce({
                data: { balance: 1000 },
                error: null
            });

            await subscriptionController.getSubscriptionStatus(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                tokens: 1000,
                plan: 'pro',
                currentPlan: 'price_pro_monthly'
            }));
        });
    });
});
