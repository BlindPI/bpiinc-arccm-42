-- Fix notifications table schema and add performance indexes
-- Based on schema analysis findings

-- Fix the updated_at column type (currently text, should be timestamp)
ALTER TABLE notifications 
ALTER COLUMN updated_at TYPE timestamp with time zone 
USING CASE 
  WHEN updated_at IS NULL OR updated_at = '' THEN NULL
  ELSE updated_at::timestamp with time zone 
END;

-- Set default value for updated_at column
ALTER TABLE notifications 
ALTER COLUMN updated_at SET DEFAULT now();

-- Add indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Create composite index for common queries (user + category + read status)
CREATE INDEX IF NOT EXISTS idx_notifications_user_category_read 
ON notifications(user_id, category, read);

-- Create index for unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, read) WHERE read = false;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to document the changes
COMMENT ON TABLE notifications IS 'Main notifications table with performance optimizations added 2025-07-21';