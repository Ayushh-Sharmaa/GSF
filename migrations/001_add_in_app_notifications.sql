-- Migration: Add in_app_notifications table for real-time notifications
-- Created: 2024

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_clerk_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'session', 'system', 'venture', 'credit')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_recipient 
  ON in_app_notifications(recipient_clerk_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read 
  ON in_app_notifications(recipient_clerk_id, is_read);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at 
  ON in_app_notifications(created_at DESC);

-- Add comment
COMMENT ON TABLE in_app_notifications IS 'Real-time in-app notifications for users';
