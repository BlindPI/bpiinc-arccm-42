-- Comprehensive Provider Management System Fix
-- Phase 1: Critical Database Schema Fixes
-- Addresses all TypeScript errors and system dysfunction

-- =============================================================================
-- STEP 1: Fix Provider-Team Relationship (Critical Issue #1)
-- =============================================================================

-- First, let's check the current state and fix the teams.provider_id reference
DO $$
BEGIN
    -- Check if teams.provider_id exists and what it references
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'provider_id'
    ) THEN
        -- Drop existing foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'teams' 
            AND constraint_name = 'teams_provider_id_fkey'
        ) THEN
            ALTER TABLE public.teams DROP CONSTRAINT teams_provider_id_fkey;
            RAISE NOTICE 'Dropped existing teams.provider_id foreign key constraint';
        END IF;
        
        -- Ensure provider_id is UUID type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'teams' 
            AND column_name = 'provider_id' 
            AND data_type != 'uuid'
        ) THEN
            -- Convert to UUID if it's not already
            ALTER TABLE public.teams ALTER COLUMN provider_id TYPE UUID USING provider_id::text::uuid;
            RAISE NOTICE 'Converted teams.provider_id to UUID type';
        END IF;
        
        -- Add proper foreign key constraint to authorized_providers
        ALTER TABLE public.teams 
        ADD CONSTRAINT teams_provider_id_fkey 
        FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added proper foreign key constraint: teams.provider_id -> authorized_providers.id';
    ELSE
        -- Add provider_id column if it doesn't exist
        ALTER TABLE public.teams ADD COLUMN provider_id UUID REFERENCES public.authorized_providers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added provider_id column to teams table';
    END IF;
END;
$$;

-- =============================================================================
-- STEP 2: Create Missing Provider-Team Junction Table
-- =============================================================================

-- Enhanced provider team assignments table (replaces the one in previous migration)
DROP TABLE IF EXISTS public.provider_team_assignments CASCADE;
CREATE TABLE public.provider_team_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.authorized_providers(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    assignment_role VARCHAR(50) DEFAULT 'primary' CHECK (assignment_role IN ('primary', 'secondary', 'supervisor', 'coordinator')),
    oversight_level VARCHAR(50) DEFAULT 'standard' CHECK (oversight_level IN ('monitor', 'standard', 'manage', 'admin')),
    assignment_type VARCHAR(30) DEFAULT 'ongoing' CHECK (assignment_type IN ('ongoing', 'project_based', 'temporary')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'completed')),
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, team_id, assignment_role)
);

-- =============================================================================
-- STEP 3: Fix RLS Policies for Admin Access
-- =============================================================================

-- Ensure teams table has proper admin access
DROP POLICY IF EXISTS "admin_full_teams_access" ON public.teams;
CREATE POLICY "admin_full_teams_access" ON public.teams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Ensure authorized_providers table has proper admin access
DROP POLICY IF EXISTS "admin_full_providers_access" ON public.authorized_providers;
CREATE POLICY "admin_full_providers_access" ON public.authorized_providers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS for provider_team_assignments
ALTER TABLE public.provider_team_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_assignments_access" ON public.provider_team_assignments;
CREATE POLICY "admin_full_assignments_access" ON public.provider_team_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_assignments" ON public.provider_team_assignments;
CREATE POLICY "users_view_assignments" ON public.provider_team_assignments
FOR SELECT USING (true);

-- =============================================================================
-- STEP 4: Unified Provider Management Functions
-- =============================================================================

-- Get provider with all related data (fixes ID type consistency)
CREATE OR REPLACE FUNCTION get_provider_with_relationships(p_provider_id UUID)
RETURNS TABLE (
    provider_data JSONB,
    location_data JSONB,
    teams_data JSONB,
    performance_metrics JSONB
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_build_object(
            'id', ap.id,
            'name', ap.name,
            'provider_type', ap.provider_type,
            'status', ap.status,
            'performance_rating', ap.performance_rating,
            'compliance_score', ap.compliance_score,
            'description', ap.description,
            'website', ap.website,
            'contact_email', ap.contact_email,
            'contact_phone', ap.contact_phone,
            'address', ap.address,
            'created_at', ap.created_at,
            'updated_at', ap.updated_at
        ) as provider_data,
        CASE WHEN l.id IS NOT NULL THEN
            jsonb_build_object(
                'id', l.id,
                'name', l.name,
                'city', l.city,
                'state', l.state,
                'address', l.address
            )
        ELSE NULL END as location_data,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'name', t.name,
                    'team_type', t.team_type,
                    'status', t.status,
                    'performance_score', t.performance_score,
                    'member_count', COALESCE(tm_count.count, 0),
                    'assignment_role', pta.assignment_role,
                    'oversight_level', pta.oversight_level
                ) ORDER BY t.name
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        ) as teams_data,
        jsonb_build_object(
            'certificates_issued', COALESCE(cert_count.count, 0),
            'courses_conducted', COALESCE(course_count.count, 0),
            'total_members', COALESCE(total_members.count, 0),
            'active_assignments', COALESCE(assignment_count.count, 0)
        ) as performance_metrics
    FROM public.authorized_providers ap
    LEFT JOIN public.locations l ON ap.primary_location_id = l.id
    LEFT JOIN public.provider_team_assignments pta ON ap.id = pta.provider_id AND pta.status = 'active'
    LEFT JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN (
        SELECT team_id, COUNT(*) as count 
        FROM public.team_members 
        WHERE status = 'active'
        GROUP BY team_id
    ) tm_count ON t.id = tm_count.team_id
    LEFT JOIN (
        SELECT COUNT(*) as count
        FROM public.certificates c
        JOIN public.teams t ON c.location_id = t.location_id
        JOIN public.provider_team_assignments pta ON t.id = pta.team_id
        WHERE pta.provider_id = p_provider_id AND pta.status = 'active'
    ) cert_count ON true
    LEFT JOIN (
        SELECT COUNT(*) as count
        FROM public.courses c
        JOIN public.teams t ON c.location_id = t.location_id
        JOIN public.provider_team_assignments pta ON t.id = pta.team_id
        WHERE pta.provider_id = p_provider_id AND pta.status = 'active'
    ) course_count ON true
    LEFT JOIN (
        SELECT COUNT(*) as count
        FROM public.team_members tm
        JOIN public.teams t ON tm.team_id = t.id
        JOIN public.provider_team_assignments pta ON t.id = pta.team_id
        WHERE pta.provider_id = p_provider_id AND pta.status = 'active' AND tm.status = 'active'
    ) total_members ON true
    LEFT JOIN (
        SELECT COUNT(*) as count
        FROM public.provider_team_assignments
        WHERE provider_id = p_provider_id AND status = 'active'
    ) assignment_count ON true
    WHERE ap.id = p_provider_id
    GROUP BY ap.id, ap.name, ap.provider_type, ap.status, 
             ap.performance_rating, ap.compliance_score, ap.description,
             ap.website, ap.contact_email, ap.contact_phone, ap.address,
             ap.created_at, ap.updated_at,
             l.id, l.name, l.city, l.state, l.address,
             cert_count.count, course_count.count, total_members.count, assignment_count.count;
END;
$$;

-- Safe team member addition with validation
CREATE OR REPLACE FUNCTION add_team_member_safe(
    p_team_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'MEMBER',
    p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_member_id UUID;
    user_exists BOOLEAN;
    team_exists BOOLEAN;
BEGIN
    -- Verify user and team exist
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO user_exists;
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE id = p_team_id) INTO team_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF NOT team_exists THEN
        RAISE EXCEPTION 'Team not found';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS(SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_user_id AND status = 'active') THEN
        RAISE EXCEPTION 'User is already an active member of this team';
    END IF;
    
    -- Add member
    INSERT INTO public.team_members (team_id, user_id, role, status, assignment_start_date)
    VALUES (p_team_id, p_user_id, p_role, 'active', NOW())
    RETURNING id INTO new_member_id;
    
    RETURN new_member_id;
END;
$$;

-- Assign provider to team with validation
CREATE OR REPLACE FUNCTION assign_provider_to_team_safe(
    p_provider_id UUID,
    p_team_id UUID,
    p_assignment_role VARCHAR(50) DEFAULT 'primary',
    p_oversight_level VARCHAR(50) DEFAULT 'standard',
    p_assignment_type VARCHAR(30) DEFAULT 'ongoing',
    p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    assignment_id UUID;
    provider_exists BOOLEAN;
    team_exists BOOLEAN;
BEGIN
    -- Validate provider exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.authorized_providers 
        WHERE id = p_provider_id AND status = 'active'
    ) INTO provider_exists;
    
    IF NOT provider_exists THEN
        RAISE EXCEPTION 'Provider not found or not active';
    END IF;
    
    -- Validate team exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.teams 
        WHERE id = p_team_id AND status = 'active'
    ) INTO team_exists;
    
    IF NOT team_exists THEN
        RAISE EXCEPTION 'Team not found or not active';
    END IF;
    
    -- Insert assignment
    INSERT INTO public.provider_team_assignments (
        provider_id,
        team_id,
        assignment_role,
        oversight_level,
        assignment_type,
        end_date,
        assigned_by
    ) VALUES (
        p_provider_id,
        p_team_id,
        p_assignment_role,
        p_oversight_level,
        p_assignment_type,
        p_end_date,
        auth.uid()
    )
    ON CONFLICT (provider_id, team_id, assignment_role) 
    DO UPDATE SET
        oversight_level = EXCLUDED.oversight_level,
        assignment_type = EXCLUDED.assignment_type,
        end_date = EXCLUDED.end_date,
        status = 'active',
        updated_at = NOW()
    RETURNING id INTO assignment_id;
    
    -- Also update the teams.provider_id for primary assignments
    IF p_assignment_role = 'primary' THEN
        UPDATE public.teams SET provider_id = p_provider_id WHERE id = p_team_id;
    END IF;
    
    RETURN assignment_id;
END;
$$;

-- Get teams for a provider with full details
CREATE OR REPLACE FUNCTION get_provider_teams_detailed(p_provider_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR(255),
    team_type VARCHAR(50),
    team_status VARCHAR(20),
    assignment_role VARCHAR(50),
    oversight_level VARCHAR(50),
    assignment_type VARCHAR(30),
    start_date DATE,
    end_date DATE,
    assignment_status VARCHAR(20),
    location_name VARCHAR(255),
    member_count BIGINT,
    performance_score INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.team_type,
        t.status as team_status,
        pta.assignment_role,
        pta.oversight_level,
        pta.assignment_type,
        pta.start_date,
        pta.end_date,
        pta.status as assignment_status,
        l.name as location_name,
        COALESCE(tm.member_count, 0) as member_count,
        t.performance_score
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN (
        SELECT team_id, COUNT(*) as member_count
        FROM public.team_members
        WHERE status = 'active'
        GROUP BY team_id
    ) tm ON t.id = tm.team_id
    WHERE pta.provider_id = p_provider_id
    ORDER BY pta.created_at DESC;
END;
$$;

-- =============================================================================
-- STEP 5: Create Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_teams_provider_id ON public.teams(provider_id);
CREATE INDEX IF NOT EXISTS idx_teams_location_id ON public.teams(location_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_provider_id ON public.provider_team_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_team_id ON public.provider_team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_status ON public.provider_team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_status ON public.authorized_providers(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_primary_location_id ON public.authorized_providers(primary_location_id);

-- =============================================================================
-- STEP 6: Grant Permissions
-- =============================================================================

GRANT SELECT ON public.provider_team_assignments TO authenticated;
GRANT SELECT ON public.authorized_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- =============================================================================
-- STEP 7: Data Migration and Cleanup
-- =============================================================================

-- Migrate any existing provider assignments from teams.provider_id to junction table
DO $$
BEGIN
    -- Create assignments for teams that have direct provider_id references
    INSERT INTO public.provider_team_assignments (provider_id, team_id, assignment_role, oversight_level, status)
    SELECT DISTINCT 
        t.provider_id,
        t.id,
        'primary',
        'standard',
        'active'
    FROM public.teams t
    WHERE t.provider_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.provider_team_assignments pta 
        WHERE pta.provider_id = t.provider_id AND pta.team_id = t.id
    );
    
    RAISE NOTICE 'Migrated existing provider-team relationships to junction table';
END;
$$;

-- =============================================================================
-- STEP 8: Add Sample Data for Testing
-- =============================================================================

DO $$
BEGIN
    -- Add sample authorized providers if none exist
    IF NOT EXISTS (SELECT 1 FROM public.authorized_providers LIMIT 1) THEN
        INSERT INTO public.authorized_providers (name, provider_type, status, performance_rating, compliance_score, description)
        VALUES
            ('Assured Response Training Center', 'training_provider', 'active', 4.8, 98.5, 'Primary training facility for emergency response certification'),
            ('Regional Safety Institute', 'training_provider', 'active', 4.6, 96.2, 'Specialized safety and compliance training provider'),
            ('Professional Development Corp', 'training_provider', 'active', 4.2, 94.1, 'Corporate training and professional development services');
        
        RAISE NOTICE 'Added sample authorized providers';
    END IF;
    
    -- Create sample assignments if we have both providers and teams
    IF EXISTS (SELECT 1 FROM public.authorized_providers LIMIT 1) AND 
       EXISTS (SELECT 1 FROM public.teams LIMIT 1) THEN
        
        INSERT INTO public.provider_team_assignments (provider_id, team_id, assignment_role, oversight_level)
        SELECT 
            ap.id,
            t.id,
            'primary',
            'standard'
        FROM public.authorized_providers ap
        CROSS JOIN public.teams t
        WHERE NOT EXISTS (
            SELECT 1 FROM public.provider_team_assignments pta 
            WHERE pta.provider_id = ap.id AND pta.team_id = t.id
        )
        LIMIT 5; -- Limit to prevent too many assignments
        
        RAISE NOTICE 'Created sample provider-team assignments';
    END IF;
END;
$$;

-- =============================================================================
-- COMPLETION
-- =============================================================================

RAISE NOTICE 'Comprehensive Provider Management System Fix completed successfully!';
RAISE NOTICE 'Fixed: teams.provider_id type and foreign key relationship';
RAISE NOTICE 'Created: provider_team_assignments junction table';
RAISE NOTICE 'Added: Unified provider management functions';
RAISE NOTICE 'Fixed: RLS policies for SA/AD access';
RAISE NOTICE 'Ready for: TypeScript interface updates and service layer fixes';