-- Fix teams table schema for Phase 3 modern components
-- Add missing columns that are expected by the new UI components

-- First, let's check and add missing columns to teams table
DO $$
BEGIN
    -- Add team_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'team_type'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN team_type VARCHAR(50) DEFAULT 'general';
        RAISE NOTICE 'Added team_type column to teams table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to teams table';
    END IF;

    -- Add performance_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'performance_score'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN performance_score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added performance_score column to teams table';
    END IF;

    -- Add provider_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN provider_id UUID REFERENCES public.providers(id);
        RAISE NOTICE 'Added provider_id column to teams table';
    END IF;

    -- Add monthly_targets column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'monthly_targets'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN monthly_targets JSONB DEFAULT '{}';
        RAISE NOTICE 'Added monthly_targets column to teams table';
    END IF;

    -- Add current_metrics column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'current_metrics'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN current_metrics JSONB DEFAULT '{}';
        RAISE NOTICE 'Added current_metrics column to teams table';
    END IF;
END $$;

-- Fix team_members table schema
DO $$
BEGIN
    -- Add status column to team_members if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to team_members table';
    END IF;

    -- Add location_assignment column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'location_assignment'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN location_assignment VARCHAR(255);
        RAISE NOTICE 'Added location_assignment column to team_members table';
    END IF;

    -- Add assignment_start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'assignment_start_date'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN assignment_start_date TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added assignment_start_date column to team_members table';
    END IF;

    -- Add assignment_end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'assignment_end_date'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN assignment_end_date TIMESTAMP;
        RAISE NOTICE 'Added assignment_end_date column to team_members table';
    END IF;

    -- Add team_position column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'team_position'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN team_position VARCHAR(100);
        RAISE NOTICE 'Added team_position column to team_members table';
    END IF;

    -- Add permissions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN permissions JSONB DEFAULT '{}';
        RAISE NOTICE 'Added permissions column to team_members table';
    END IF;

    -- Add last_activity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'last_activity'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN last_activity TIMESTAMP;
        RAISE NOTICE 'Added last_activity column to team_members table';
    END IF;
END $$;

-- Create providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'active',
    primary_location_id UUID REFERENCES public.locations(id),
    performance_rating INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    description TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON public.teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_performance_score ON public.teams(performance_score);
CREATE INDEX IF NOT EXISTS idx_teams_provider_id ON public.teams(provider_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);

-- Update existing teams with default values
UPDATE public.teams 
SET 
    team_type = COALESCE(team_type, 'general'),
    status = COALESCE(status, 'active'),
    performance_score = COALESCE(performance_score, 0),
    monthly_targets = COALESCE(monthly_targets, '{}'),
    current_metrics = COALESCE(current_metrics, '{}')
WHERE team_type IS NULL OR status IS NULL OR performance_score IS NULL;

-- Update existing team_members with default values
UPDATE public.team_members 
SET 
    status = COALESCE(status, 'active'),
    permissions = COALESCE(permissions, '{}'),
    assignment_start_date = COALESCE(assignment_start_date, created_at)
WHERE status IS NULL OR permissions IS NULL OR assignment_start_date IS NULL;

-- Add constraints
ALTER TABLE public.teams 
ADD CONSTRAINT teams_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

ALTER TABLE public.teams 
ADD CONSTRAINT teams_performance_score_check 
CHECK (performance_score >= 0 AND performance_score <= 100);

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_status_check 
CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended'));

-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for providers
CREATE POLICY "Users can view providers" ON public.providers
FOR SELECT USING (true);

CREATE POLICY "SA and AD can manage providers" ON public.providers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Grant permissions
GRANT SELECT ON public.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.teams.team_type IS 'Type of team (general, training, operations, management, support)';
COMMENT ON COLUMN public.teams.status IS 'Current status of the team (active, inactive, suspended)';
COMMENT ON COLUMN public.teams.performance_score IS 'Team performance score (0-100)';
COMMENT ON COLUMN public.teams.monthly_targets IS 'JSON object containing monthly targets and goals';
COMMENT ON COLUMN public.teams.current_metrics IS 'JSON object containing current performance metrics';

COMMENT ON COLUMN public.team_members.status IS 'Member status (active, inactive, on_leave, suspended)';
COMMENT ON COLUMN public.team_members.permissions IS 'JSON object containing member permissions';
COMMENT ON COLUMN public.team_members.location_assignment IS 'Assigned location for this team member';
COMMENT ON COLUMN public.team_members.team_position IS 'Position/role within the team';

-- Create function to update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the team's current metrics with member count
    UPDATE public.teams 
    SET current_metrics = jsonb_set(
        COALESCE(current_metrics, '{}'),
        '{member_count}',
        (
            SELECT COUNT(*)::text::jsonb 
            FROM public.team_members 
            WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
            AND status = 'active'
        )
    )
    WHERE id = COALESCE(NEW.team_id, OLD.team_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain member count
DROP TRIGGER IF EXISTS update_team_member_count_trigger ON public.team_members;
CREATE TRIGGER update_team_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_member_count();

-- Initialize member counts for existing teams
UPDATE public.teams 
SET current_metrics = jsonb_set(
    COALESCE(current_metrics, '{}'),
    '{member_count}',
    (
        SELECT COALESCE(COUNT(*), 0)::text::jsonb 
        FROM public.team_members 
        WHERE team_id = teams.id
        AND status = 'active'
    )
);

-- Create sample data if tables are empty
DO $$
BEGIN
    -- Add sample providers if none exist
    IF NOT EXISTS (SELECT 1 FROM public.providers LIMIT 1) THEN
        INSERT INTO public.providers (name, provider_type, status, performance_rating, compliance_score)
        VALUES 
            ('Training Solutions Inc', 'training', 'active', 85, 92),
            ('Operations Partners LLC', 'operations', 'active', 78, 88),
            ('Support Services Co', 'support', 'active', 82, 90);
        
        RAISE NOTICE 'Added sample providers';
    END IF;

    -- Update teams with sample data if they have default values
    UPDATE public.teams 
    SET 
        team_type = CASE 
            WHEN name ILIKE '%training%' THEN 'training'
            WHEN name ILIKE '%operations%' THEN 'operations'
            WHEN name ILIKE '%support%' THEN 'support'
            WHEN name ILIKE '%management%' THEN 'management'
            ELSE 'general'
        END,
        performance_score = 75 + (RANDOM() * 25)::INTEGER,
        monthly_targets = jsonb_build_object(
            'certificates_target', 50,
            'courses_target', 20,
            'satisfaction_target', 85
        ),
        current_metrics = jsonb_build_object(
            'certificates_issued', (RANDOM() * 40)::INTEGER,
            'courses_conducted', (RANDOM() * 15)::INTEGER,
            'satisfaction_score', 80 + (RANDOM() * 15)::INTEGER
        )
    WHERE team_type = 'general' AND performance_score = 0;
END $$;

RAISE NOTICE 'Teams table schema updated successfully for Phase 3 components';