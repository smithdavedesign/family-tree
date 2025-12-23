-- Payment & Token System Schema Migration

-- 1. Add stripe_customer_id to users table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
        ALTER TABLE users ADD COLUMN plan_tier TEXT DEFAULT 'free'; -- 'free', 'pro', 'enterprise'
    END IF;
END $$;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_plan_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'past_due', 'canceled', etc.
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create token_balances table
CREATE TABLE IF NOT EXISTS token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_lifetime_accrued INTEGER DEFAULT 0,
    last_refill_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create token_usage_logs table for audit
CREATE TABLE IF NOT EXISTS token_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    action TEXT NOT NULL, -- e.g. 'ai_story_generation', 'export_pdf'
    feature_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Subscriptions: Users can view their own
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Token Balances: Users can view their own
CREATE POLICY "Users can view own token balance" ON token_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Token Usage Logs: Users can view their own
CREATE POLICY "Users can view own usage logs" ON token_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 7. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_balances_updated_at
    BEFORE UPDATE ON token_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
