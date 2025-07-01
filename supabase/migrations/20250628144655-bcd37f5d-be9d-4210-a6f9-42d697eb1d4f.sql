
-- Migration 02: Create user_achievements table
-- Create table to track user achievements and milestones

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    points_awarded INTEGER DEFAULT 0,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    badge_icon VARCHAR(100),
    category VARCHAR(50) DEFAULT 'general',
    tier_level VARCHAR(20) DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to profiles
ALTER TABLE user_achievements 
ADD CONSTRAINT fk_user_achievements_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achieved_at ON user_achievements(achieved_at);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "SA and AD can view all achievements" ON user_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "System can insert achievements" ON user_achievements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "SA and AD can manage achievements" ON user_achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );
