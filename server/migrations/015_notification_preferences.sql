-- Migration: Phase 10 - Email Notification System
-- Creates notification_preferences and notification_logs tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_on_comment BOOLEAN DEFAULT true,
  email_on_story BOOLEAN DEFAULT true,
  email_on_album BOOLEAN DEFAULT true,
  email_on_person BOOLEAN DEFAULT true,
  email_on_invite BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'daily', 'weekly', 'never')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification logs for audit trail
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('comment', 'story', 'album', 'person', 'invite')),
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  email_subject TEXT,
  email_status TEXT DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'bounced', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type ON notification_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS policies for notification_logs (users can view their own logs)
CREATE POLICY "Users can view their own notification logs"
ON notification_logs FOR SELECT
USING (user_id = auth.uid());

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
