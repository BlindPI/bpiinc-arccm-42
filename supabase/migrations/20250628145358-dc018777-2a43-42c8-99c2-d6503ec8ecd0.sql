
-- Migration 05: Create advanced user analytics and tracking system
-- Enterprise user behavior analytics and performance tracking infrastructure

-- User activity tracking for detailed analytics
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    session_id VARCHAR(255),
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User performance metrics aggregation
CREATE TABLE IF NOT EXISTS user_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_date DATE NOT NULL,
    context_data JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    period_type VARCHAR(20) DEFAULT 'daily'
);

-- User engagement scoring system
CREATE TABLE IF NOT EXISTS user_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    activity_score DECIMAL(5,2) DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    score_breakdown JSONB DEFAULT '{}',
    calculated_date DATE NOT NULL,
    score_trend VARCHAR(20) DEFAULT 'stable',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System usage patterns tracking
CREATE TABLE IF NOT EXISTS system_usage_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    usage_date DATE NOT NULL,
    peak_usage_hour INTEGER,
    pattern_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking across different areas
CREATE TABLE IF NOT EXISTS user_progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    progress_type VARCHAR(100) NOT NULL,
    progress_category VARCHAR(50) NOT NULL,
    current_stage VARCHAR(100) NOT NULL,
    total_stages INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    milestones_achieved JSONB DEFAULT '[]',
    next_milestone JSONB DEFAULT '{}',
    estimated_completion DATE,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON user_activity_logs(user_id, activity_type, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category_date ON user_activity_logs(activity_category, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session ON user_activity_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_date ON user_performance_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON user_performance_metrics(metric_type, metric_category);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_user_date ON user_engagement_scores(user_id, calculated_date);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_trend ON user_engagement_scores(score_trend, calculated_date);
CREATE INDEX IF NOT EXISTS idx_usage_patterns_feature_date ON system_usage_patterns(feature_name, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_patterns_success_rate ON system_usage_patterns(success_rate, usage_date);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_type ON user_progress_tracking(user_id, progress_type);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_completion ON user_progress_tracking(completion_percentage, progress_category);

-- Enable RLS on all tables
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view their own activity logs" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "SA and AD can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON user_performance_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "SA, AD, AP can view all performance metrics" ON user_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD', 'AP')
        )
    );

CREATE POLICY "System can manage performance metrics" ON user_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- RLS Policies for user_engagement_scores
CREATE POLICY "Users can view their own engagement scores" ON user_engagement_scores
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "SA, AD, AP can view all engagement scores" ON user_engagement_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD', 'AP')
        )
    );

CREATE POLICY "System can manage engagement scores" ON user_engagement_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- RLS Policies for system_usage_patterns
CREATE POLICY "SA and AD can view usage patterns" ON system_usage_patterns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "System can manage usage patterns" ON system_usage_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- RLS Policies for user_progress_tracking
CREATE POLICY "Users can view their own progress tracking" ON user_progress_tracking
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "SA, AD, AP can view all progress tracking" ON user_progress_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD', 'AP')
        )
    );

CREATE POLICY "System can manage progress tracking" ON user_progress_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- Auto-update triggers
CREATE TRIGGER update_user_progress_tracking_updated_at 
    BEFORE UPDATE ON user_progress_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    activity_score DECIMAL(5,2) := 0;
    compliance_score DECIMAL(5,2) := 0;
    performance_score DECIMAL(5,2) := 0;
    final_score DECIMAL(5,2) := 0;
BEGIN
    -- Calculate activity score based on recent activity
    SELECT COALESCE(
        LEAST(100, COUNT(*) * 2.5), 0
    ) INTO activity_score
    FROM user_activity_logs
    WHERE user_id = p_user_id
    AND created_at >= p_date - INTERVAL '7 days'
    AND created_at < p_date + INTERVAL '1 day';
    
    -- Get compliance score from profile
    SELECT COALESCE(
        CASE 
            WHEN compliance_status = true THEN 100
            ELSE 0
        END, 0
    ) INTO compliance_score
    FROM profiles
    WHERE id = p_user_id;
    
    -- Calculate performance score based on recent metrics
    SELECT COALESCE(AVG(metric_value), 0) INTO performance_score
    FROM user_performance_metrics
    WHERE user_id = p_user_id
    AND metric_date >= p_date - INTERVAL '30 days'
    AND metric_date <= p_date;
    
    -- Calculate weighted final score
    final_score := (activity_score * 0.4) + (compliance_score * 0.3) + (performance_score * 0.3);
    
    -- Insert or update engagement score
    INSERT INTO user_engagement_scores (
        user_id,
        engagement_score,
        activity_score,
        compliance_score,
        performance_score,
        calculated_date,
        score_breakdown
    ) VALUES (
        p_user_id,
        final_score,
        activity_score,
        compliance_score,
        performance_score,
        p_date,
        jsonb_build_object(
            'activity_weight', 0.4,
            'compliance_weight', 0.3,
            'performance_weight', 0.3,
            'calculation_date', p_date
        )
    )
    ON CONFLICT (user_id, calculated_date) 
    DO UPDATE SET
        engagement_score = EXCLUDED.engagement_score,
        activity_score = EXCLUDED.activity_score,
        compliance_score = EXCLUDED.compliance_score,
        performance_score = EXCLUDED.performance_score,
        score_breakdown = EXCLUDED.score_breakdown;
    
    RETURN final_score;
END;
$$ language 'plpgsql';

-- Function to update system usage patterns
CREATE OR REPLACE FUNCTION update_system_usage_pattern(
    p_feature_name VARCHAR(100),
    p_success BOOLEAN DEFAULT true,
    p_duration_seconds INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    current_hour INTEGER := EXTRACT(HOUR FROM NOW());
BEGIN
    INSERT INTO system_usage_patterns (
        feature_name,
        usage_count,
        unique_users,
        total_duration_seconds,
        error_count,
        usage_date,
        peak_usage_hour
    ) VALUES (
        p_feature_name,
        1,
        1,
        p_duration_seconds,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        current_date,
        current_hour
    )
    ON CONFLICT (feature_name, usage_date)
    DO UPDATE SET
        usage_count = system_usage_patterns.usage_count + 1,
        total_duration_seconds = system_usage_patterns.total_duration_seconds + p_duration_seconds,
        error_count = system_usage_patterns.error_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        success_rate = CASE 
            WHEN (system_usage_patterns.usage_count + 1) > 0 THEN
                ((system_usage_patterns.usage_count + 1 - system_usage_patterns.error_count - CASE WHEN p_success THEN 0 ELSE 1 END)::DECIMAL / (system_usage_patterns.usage_count + 1)) * 100
            ELSE 100
        END,
        peak_usage_hour = CASE 
            WHEN current_hour = system_usage_patterns.peak_usage_hour THEN current_hour
            ELSE current_hour
        END;
END;
$$ language 'plpgsql';
