-- Migration: Add user_subscriptions table for subscription & entitlement tracking
-- Created: 2024

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  plan_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'BUILDER', 'FOUNDER')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP,
  trial_ends_at TIMESTAMP,
  canceled_at TIMESTAMP,
  -- Stripe integration fields (optional, for future use)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
  ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_tier 
  ON user_subscriptions(plan_tier);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end 
  ON user_subscriptions(current_period_end);

-- Add comment
COMMENT ON TABLE user_subscriptions IS 'User subscription tiers and entitlement tracking';
COMMENT ON COLUMN user_subscriptions.user_id IS 'Clerk User ID (unique)';
COMMENT ON COLUMN user_subscriptions.plan_tier IS 'Subscription tier: FREE, BUILDER, or FOUNDER';
COMMENT ON COLUMN user_subscriptions.status IS 'Subscription status: active, past_due, canceled, or expired';
COMMENT ON COLUMN user_subscriptions.trial_ends_at IS 'Trial period expiration date (null if not in trial)';
