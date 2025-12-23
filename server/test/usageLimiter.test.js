const { describe, it, expect, beforeEach } = require('@jest/globals');

// Helper to create a fluent mock chain
const createChain = () => {
    const chain = {};
    chain.from = jest.fn(() => chain);
    chain.select = jest.fn(() => chain);
    chain.insert = jest.fn(() => ({ then: (cb) => cb({ error: null }) }));
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

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const { checkTokens } = require('../middleware/usageLimiter');

describe('Usage Limiter Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: 'test-user-id' },
            originalUrl: '/api/test'
        };
        res = {
            json: jest.fn(),
            status: jest.fn(() => res)
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should allow request if tokens are sufficient', async () => {
        const balanceChain = createChain();
        mockSupabaseAdmin.from.mockImplementation((table) => {
            if (table === 'token_balances') return balanceChain;
            return createChain();
        });

        // 1. Initial balance check: .from().select().eq().single()
        // eq() should return chain
        balanceChain.eq.mockReturnValueOnce(balanceChain);
        // single() should return data
        balanceChain.single.mockResolvedValueOnce({
            data: { balance: 100, last_refill_date: new Date() },
            error: null
        });

        // 2. Deduction: .from().update().eq()
        // eq() is at end, should return promise
        balanceChain.eq.mockResolvedValueOnce({ error: null });

        const middleware = checkTokens(10);
        await middleware(req, res, next);

        expect(balanceChain.update).toHaveBeenCalledWith(
            expect.objectContaining({ balance: 90 })
        );
        expect(next).toHaveBeenCalled();
    });

    it('should block request if tokens are insufficient', async () => {
        const balanceChain = createChain();
        mockSupabaseAdmin.from.mockImplementation((table) => {
            if (table === 'token_balances') return balanceChain;
            return createChain();
        });

        balanceChain.eq.mockReturnValueOnce(balanceChain);
        balanceChain.single.mockResolvedValueOnce({
            data: { balance: 5, last_refill_date: new Date() },
            error: null
        });

        const middleware = checkTokens(10);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Insufficient tokens'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should trigger lazy refill if last refill was more than a month ago', async () => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const balanceChain = createChain();
        const subChain = createChain();

        mockSupabaseAdmin.from.mockImplementation((table) => {
            if (table === 'token_balances') return balanceChain;
            if (table === 'subscriptions') return subChain;
            return createChain();
        });

        // 1. Initial balance check: .from('token_balances').select('*').eq('user_id', userId).single();
        balanceChain.eq.mockReturnValueOnce(balanceChain);
        balanceChain.single.mockResolvedValueOnce({
            data: { balance: 0, last_refill_date: twoMonthsAgo },
            error: null
        });

        // 2. Subscription fetch: .from('subscriptions').select(...).eq(...).eq(...).single();
        subChain.eq.mockReturnValue(subChain); // return chain for both eq calls
        subChain.single.mockResolvedValueOnce({
            data: { stripe_plan_id: 'pro-monthly' },
            error: null
        });

        // 3. Refill update: .from('token_balances').update(...).eq(...);
        balanceChain.eq.mockResolvedValueOnce({ error: null });

        // 4. Deduction update: .from('token_balances').update(...).eq(...);
        balanceChain.eq.mockResolvedValueOnce({ error: null });

        const middleware = checkTokens(10);
        await middleware(req, res, next);

        // Expect refill to 1000
        expect(balanceChain.update).toHaveBeenNthCalledWith(1,
            expect.objectContaining({ balance: 1000 })
        );
        // Then deduction of 10
        expect(balanceChain.update).toHaveBeenNthCalledWith(2,
            expect.objectContaining({ balance: 990 })
        );
        expect(next).toHaveBeenCalled();
    });
});
