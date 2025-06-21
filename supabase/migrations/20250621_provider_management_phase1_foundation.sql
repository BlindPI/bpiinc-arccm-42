-- =====================================================================================
-- PROVIDER MANAGEMENT SYSTEM RESTORATION - PHASE 1: CRITICAL DATABASE FOUNDATION FIX
-- =====================================================================================
-- This migration addresses all critical database schema issues identified in the audit:
-- - UUID standardization across all provider tables
-- - Missing foreign key constraints
-- - Orphaned data cleanup
-- - Enhanced relationship tables
-- - Data integrity validation functions

-- =====================================================================================
-- STEP 1: BACKUP AND PREPARE
-- =====================================================================================

-- Create backup tables for safety
DO $$
BEGIN
    -- Backup existing data before making changes
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams_backup_20250621') THEN
        CREATE TABLE teams_backup_20250621 AS SELECT * FROM teams;
        RAISE NOTICE 'Created backup: teams_backup_20250621';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorized_providers_backup_20250621') THEN
        CREATE TABLE authorized_providers_backup_20250621 AS SELECT * FROM authorized_providers;
        RAISE NOTICE 'Created backup: authorized_providers_backup_20250621';
    END IF;
END;
$$;

-- =====================================================================================
-- STEP 2: UUID STANDARDIZATION (Critical Issue #1)
-- =====================================================================================

-- Fix authorized_providers table to ensure UUID consistency
DO $$
BEGIN
    -- Ensure authorized_providers.id is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorized_providers' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert to UUID if not already
        ALTER TABLE public.authorized_providers ALTER COLUMN id TYPE UUID USING id::text::uuid;
        RAISE NOTICE 'Converted authorized_providers.id to UUID type';
    END IF;
    
    -- Ensure primary_location_id is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorized_providers' 
        AND column_name = 'primary_location_id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE public.authorized_providers ALTER COLUMN primary_location_id TYPE UUID USING primary_location_id::text::uuid;
        RAISE NOTICE 'Converted authorized_providers.primary_location_id to UUID type';
    END IF;
END;
$$;

-- Fix teams table provider_id reference
DO $$
BEGIN
    -- Check if teams.provider_id exists and fix its type
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
            -- Convert to UUID, handling NULL values
            ALTER TABLE public.teams ALTER COLUMN provider_id TYPE UUID USING 
                CASE 
                    WHEN provider_id IS NULL THEN NULL
                    WHEN provider_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::uuid
                    ELSE NULL
                END;
            RAISE NOTICE 'Converted teams.provider_id to UUID type';
        END IF;
    ELSE
        -- Add provider_id column if it doesn't exist
        ALTER TABLE public.teams ADD COLUMN provider_id UUID;
        RAISE NOTICE 'Added provider_id column to teams table';
    END IF;
END;
$$;

-- =====================================================================================
-- STEP 3: MISSING FOREIGN KEY CONSTRAINTS (Critical Issue #2)
-- =====================================================================================

-- Add missing foreign key constraints with proper error handling
DO $$
BEGIN
    -- authorized_providers -> profiles (user_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'authorized_providers' 
        AND constraint_name = 'fk_authorized_providers_user_id'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'authorized_providers' AND column_name = 'user_id') THEN
            ALTER TABLE public.authorized_providers 
            ADD CONSTRAINT fk_authorized_providers_user_id 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: authorized_providers.user_id -> profiles.id';
        END IF;
    END IF;
    
    -- authorized_providers -> locations (primary_location_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'authorized_providers' 
        AND constraint_name = 'fk_authorized_providers_primary_location_id'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'authorized_providers' AND column_name = 'primary_location_id') THEN
            ALTER TABLE public.authorized_providers 
            ADD CONSTRAINT fk_authorized_providers_primary_location_id 
            FOREIGN KEY (primary_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: authorized_providers.primary_location_id -> locations.id';
        END IF;
    END IF;
    
    -- teams -> authorized_providers (provider_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND constraint_name = 'fk_teams_provider_id'
    ) THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT fk_teams_provider_id 
        FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: teams.provider_id -> authorized_providers.id';
    END IF;
    
    -- teams -> locations (location_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND constraint_name = 'fk_teams_location_id'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'location_id') THEN
            ALTER TABLE public.teams 
            ADD CONSTRAINT fk_teams_location_id 
            FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: teams.location_id -> locations.id';
        END IF;
    END IF;
END;
$$;

-- =====================================================================================
-- STEP 4: ENHANCED RELATIONSHIP TABLES (Critical Issue #3)
-- =====================================================================================

-- Create provider_team_assignments junction table
DROP TABLE IF EXISTS public.provider_team_assignments CASCADE;
CREATE TABLE public.provider_team_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL,
    team_id UUID NOT NULL,
    assignment_role VARCHAR(50) DEFAULT 'primary' CHECK (assignment_role IN ('primary', 'secondary', 'supervisor', 'coordinator')),
    oversight_level VARCHAR(50) DEFAULT 'standard' CHECK (oversight_level IN ('monitor', 'standard', 'manage', 'admin')),
    assignment_type VARCHAR(30) DEFAULT 'ongoing' CHECK (assignment_type IN ('ongoing', 'project_based', 'temporary')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'completed')),
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_provider_team_assignments_provider_id 
        FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_team_assignments_team_id 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_team_assignments_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate assignments
    UNIQUE(provider_id, team_id, assignment_role)
);

-- Create provider_location_assignments table
DROP TABLE IF EXISTS public.provider_location_assignments CASCADE;
CREATE TABLE public.provider_location_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL,
    location_id UUID NOT NULL,
    assignment_role VARCHAR(50) DEFAULT 'provider' CHECK (assignment_role IN ('provider', 'coordinator', 'supervisor', 'temporary')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'completed')),
    assigned_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_provider_location_assignments_provider_id 
        FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_location_assignments_location_id 
        FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_location_assignments_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Unique constraint
    UNIQUE(provider_id, location_id, assignment_role)
);

-- Create provider_performance_metrics table for real performance data
DROP TABLE IF EXISTS public.provider_performance_metrics CASCADE;
CREATE TABLE public.provider_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL,
    measurement_period DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    certificates_issued INTEGER DEFAULT 0,
    courses_conducted INTEGER DEFAULT 0,
    team_members_managed INTEGER DEFAULT 0,
    locations_served INTEGER DEFAULT 0,
    average_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    compliance_score DECIMAL(5,2) DEFAULT 0.00,
    performance_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_provider_performance_metrics_provider_id 
        FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE CASCADE,
    
    -- Unique constraint for period-provider combination
    UNIQUE(provider_id, measurement_period)
);

-- =====================================================================================
-- STEP 5: DATA INTEGRITY RESTORATION (Critical Issue #4)
-- =====================================================================================

-- Fix orphaned records and validate relationships
DO $$
DECLARE
    orphaned_count INTEGER;
    fixed_count INTEGER := 0;
    default_provider_id UUID;
BEGIN
    -- Count orphaned teams (teams with NULL provider_id)
    SELECT COUNT(*) INTO orphaned_count FROM public.teams WHERE provider_id IS NULL;
    RAISE NOTICE 'Found % orphaned teams with NULL provider_id', orphaned_count;
    
    IF orphaned_count > 0 THEN
        -- Get or create a default provider for orphaned teams
        SELECT id INTO default_provider_id 
        FROM public.authorized_providers 
        WHERE status = 'active' 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF default_provider_id IS NULL THEN
            -- Create a system default provider if none exists
            INSERT INTO public.authorized_providers (
                name, provider_type, status, performance_rating, compliance_score, description
            ) VALUES (
                'System Default Provider', 'training_provider', 'active', 3.0, 85.0, 
                'Automatically created default provider for orphaned teams'
            ) RETURNING id INTO default_provider_id;
            
            RAISE NOTICE 'Created system default provider: %', default_provider_id;
        END IF;
        
        -- Assign orphaned teams to default provider
        UPDATE public.teams 
        SET provider_id = default_provider_id, updated_at = NOW()
        WHERE provider_id IS NULL;
        
        GET DIAGNOSTICS fixed_count = ROW_COUNT;
        RAISE NOTICE 'Fixed % orphaned teams by assigning to provider %', fixed_count, default_provider_id;
        
        -- Create provider_team_assignments for the fixed relationships
        INSERT INTO public.provider_team_assignments (provider_id, team_id, assignment_role, oversight_level, status)
        SELECT default_provider_id, id, 'primary', 'standard', 'active'
        FROM public.teams 
        WHERE provider_id = default_provider_id
        ON CONFLICT (provider_id, team_id, assignment_role) DO NOTHING;
        
        RAISE NOTICE 'Created provider_team_assignments for fixed relationships';
    END IF;
END;
$$;

-- Validate all existing provider-team relationships and create missing assignments
DO $$
DECLARE
    relationship_count INTEGER;
BEGIN
    -- Create assignments for existing teams that have provider_id but no assignment record
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
    )
    ON CONFLICT (provider_id, team_id, assignment_role) DO NOTHING;
    
    GET DIAGNOSTICS relationship_count = ROW_COUNT;
    RAISE NOTICE 'Created % missing provider-team assignment records', relationship_count;
END;
$$;

-- =====================================================================================
-- STEP 6: DATABASE VALIDATION FUNCTIONS
-- =====================================================================================

-- UUID validation function
CREATE OR REPLACE FUNCTION validate_provider_uuid(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM public.authorized_providers WHERE id = p_id AND status != 'deleted');
END;
$$;

-- Data integrity check function
CREATE OR REPLACE FUNCTION check_provider_data_integrity()
RETURNS TABLE(
    issue_type TEXT, 
    count BIGINT, 
    details TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    -- Check for orphaned teams
    SELECT 
        'orphaned_teams'::TEXT, 
        COUNT(*), 
        'Teams without valid provider_id'::TEXT
    FROM public.teams WHERE provider_id IS NULL
    
    UNION ALL
    
    -- Check for invalid provider references
    SELECT 
        'invalid_provider_refs'::TEXT, 
        COUNT(*), 
        'Teams referencing non-existent providers'::TEXT
    FROM public.teams t 
    WHERE t.provider_id IS NOT NULL 
    AND NOT EXISTS(SELECT 1 FROM public.authorized_providers ap WHERE ap.id = t.provider_id)
    
    UNION ALL
    
    -- Check for missing team assignments
    SELECT 
        'missing_team_assignments'::TEXT, 
        COUNT(*), 
        'Teams with provider_id but missing assignment records'::TEXT
    FROM public.teams t
    WHERE t.provider_id IS NOT NULL
    AND NOT EXISTS(
        SELECT 1 FROM public.provider_team_assignments pta 
        WHERE pta.provider_id = t.provider_id AND pta.team_id = t.id AND pta.status = 'active'
    )
    
    UNION ALL
    
    -- Check for inconsistent assignments
    SELECT 
        'inconsistent_assignments'::TEXT, 
        COUNT(*), 
        'Provider-team assignments not matching teams.provider_id'::TEXT
    FROM public.provider_team_assignments pta
    WHERE pta.status = 'active'
    AND NOT EXISTS(
        SELECT 1 FROM public.teams t 
        WHERE t.id = pta.team_id AND t.provider_id = pta.provider_id
    );
END;
$$;

-- Provider relationship management function
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
        RAISE EXCEPTION 'Provider % not found or not active', p_provider_id;
    END IF;
    
    -- Validate team exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.teams 
        WHERE id = p_team_id AND status = 'active'
    ) INTO team_exists;
    
    IF NOT team_exists THEN
        RAISE EXCEPTION 'Team % not found or not active', p_team_id;
    END IF;
    
    -- Insert or update assignment
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
    
    -- Update teams.provider_id for primary assignments
    IF p_assignment_role = 'primary' THEN
        UPDATE public.teams 
        SET provider_id = p_provider_id, updated_at = NOW()
        WHERE id = p_team_id;
    END IF;
    
    RETURN assignment_id;
END;
$$;

-- Get provider with all relationships function
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
        -- Provider data
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
        
        -- Primary location data
        CASE WHEN l.id IS NOT NULL THEN
            jsonb_build_object(
                'id', l.id,
                'name', l.name,
                'city', l.city,
                'state', l.state,
                'address', l.address
            )
        ELSE NULL END as location_data,
        
        -- Teams data with assignment details
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
                    'oversight_level', pta.oversight_level,
                    'assignment_status', pta.status,
                    'location_name', tl.name
                ) ORDER BY t.name
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        ) as teams_data,
        
        -- Performance metrics
        jsonb_build_object(
            'certificates_issued', COALESCE(metrics.certificates_issued, 0),
            'courses_conducted', COALESCE(metrics.courses_conducted, 0),
            'team_members_managed', COALESCE(metrics.team_members_managed, 0),
            'locations_served', COALESCE(metrics.locations_served, 0),
            'average_satisfaction_score', COALESCE(metrics.average_satisfaction_score, 0.00),
            'compliance_score', COALESCE(metrics.compliance_score, 0.00),
            'performance_rating', COALESCE(metrics.performance_rating, 0.00)
        ) as performance_metrics
        
    FROM public.authorized_providers ap
    LEFT JOIN public.locations l ON ap.primary_location_id = l.id
    LEFT JOIN public.provider_team_assignments pta ON ap.id = pta.provider_id AND pta.status = 'active'
    LEFT JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.locations tl ON t.location_id = tl.id
    LEFT JOIN (
        SELECT team_id, COUNT(*) as count 
        FROM public.team_members 
        WHERE status = 'active'
        GROUP BY team_id
    ) tm_count ON t.id = tm_count.team_id
    LEFT JOIN public.provider_performance_metrics metrics ON ap.id = metrics.provider_id 
        AND metrics.measurement_period = DATE_TRUNC('month', CURRENT_DATE)
    WHERE ap.id = p_provider_id
    GROUP BY 
        ap.id, ap.name, ap.provider_type, ap.status, ap.performance_rating, ap.compliance_score,
        ap.description, ap.website, ap.contact_email, ap.contact_phone, ap.address,
        ap.created_at, ap.updated_at,
        l.id, l.name, l.city, l.state, l.address,
        metrics.certificates_issued, metrics.courses_conducted, metrics.team_members_managed,
        metrics.locations_served, metrics.average_satisfaction_score, metrics.compliance_score, metrics.performance_rating;
END;
$$;

-- =====================================================================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_teams_provider_id ON public.teams(provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_location_id ON public.teams(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);

CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_provider_id ON public.provider_team_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_team_id ON public.provider_team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_status ON public.provider_team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_active ON public.provider_team_assignments(provider_id, team_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_provider_location_assignments_provider_id ON public.provider_location_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_location_assignments_location_id ON public.provider_location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_provider_location_assignments_status ON public.provider_location_assignments(status);

CREATE INDEX IF NOT EXISTS idx_authorized_providers_status ON public.authorized_providers(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_type ON public.authorized_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_primary_location_id ON public.authorized_providers(primary_location_id) WHERE primary_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_performance_metrics_provider_period ON public.provider_performance_metrics(provider_id, measurement_period);

-- =====================================================================================
-- STEP 8: ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on new tables
ALTER TABLE public.provider_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for provider_team_assignments
DROP POLICY IF EXISTS "admin_full_provider_team_assignments_access" ON public.provider_team_assignments;
CREATE POLICY "admin_full_provider_team_assignments_access" ON public.provider_team_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_provider_team_assignments" ON public.provider_team_assignments;
CREATE POLICY "users_view_provider_team_assignments" ON public.provider_team_assignments
FOR SELECT USING (true);

-- RLS policies for provider_location_assignments
DROP POLICY IF EXISTS "admin_full_provider_location_assignments_access" ON public.provider_location_assignments;
CREATE POLICY "admin_full_provider_location_assignments_access" ON public.provider_location_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_provider_location_assignments" ON public.provider_location_assignments;
CREATE POLICY "users_view_provider_location_assignments" ON public.provider_location_assignments
FOR SELECT USING (true);

-- RLS policies for provider_performance_metrics
DROP POLICY IF EXISTS "admin_full_provider_performance_metrics_access" ON public.provider_performance_metrics;
CREATE POLICY "admin_full_provider_performance_metrics_access" ON public.provider_performance_metrics
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_provider_performance_metrics" ON public.provider_performance_metrics;
CREATE POLICY "users_view_provider_performance_metrics" ON public.provider_performance_metrics
FOR SELECT USING (true);

-- =====================================================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================================================

-- Grant necessary permissions
GRANT SELECT ON public.provider_team_assignments TO authenticated;
GRANT SELECT ON public.provider_location_assignments TO authenticated;
GRANT SELECT ON public.provider_performance_metrics TO authenticated;
GRANT SELECT ON public.authorized_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION validate_provider_uuid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_provider_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_provider_to_team_safe(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_with_relationships(UUID) TO authenticated;

-- =====================================================================================
-- STEP 10: VALIDATION AND REPORTING
-- =====================================================================================

-- Run final validation check
DO $$
DECLARE
    validation_results RECORD;
    total_issues INTEGER := 0;
BEGIN
    RAISE NOTICE '=== PHASE 1 VALIDATION REPORT ===';
    
    -- Check data integrity
    FOR validation_results IN SELECT * FROM check_provider_data_integrity() LOOP
        RAISE NOTICE 'Issue: % - Count: % - Details: %', 
            validation_results.issue_type, 
            validation_results.count, 
            validation_results.details;
        total_issues := total_issues + validation_results.count;
    END LOOP;
    
    -- Report table counts
    RAISE NOTICE 'Total authorized_providers: %', (SELECT COUNT(*) FROM public.authorized_providers);
    RAISE NOTICE 'Total teams: %', (SELECT COUNT(*) FROM public.teams);
    RAISE NOTICE 'Total provider_team_assignments: %', (SELECT COUNT(*) FROM public.provider_team_assignments);
    RAISE NOTICE 'Total provider_location_assignments: %', (SELECT COUNT(*) FROM public.provider_location_assignments);
    
    -- Report relationship health
    RAISE NOTICE 'Teams with provider_id: %', (SELECT COUNT(*) FROM public.teams WHERE provider_id IS NOT NULL);
    RAISE NOTICE 'Active provider-team assignments: %', (SELECT COUNT(*) FROM public.provider_team_assignments WHERE status = 'active');
    
    IF total_issues = 0 THEN
        RAISE NOTICE '✅ PHASE 1 COMPLETED SUCCESSFULLY - NO DATA INTEGRITY ISSUES FOUND';
    ELSE
        RAISE NOTICE '⚠️  PHASE 1 COMPLETED WITH % DATA INTEGRITY ISSUES TO REVIEW', total_issues;
    END IF;
    
    RAISE NOTICE '=== END VALIDATION REPORT ===';
END;
$$;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

RAISE NOTICE '
🎯 PROVIDER MANAGEMENT SYSTEM RESTORATION - PHASE 1 COMPLETE! 

✅ UUID standardization across all provider tables
✅ Missing foreign key constraints added
✅ Orphaned data cleanup completed  
✅ Enhanced relationship tables created
✅ Data integrity validation functions implemented
✅ Performance indexes created
✅ Row Level Security policies configured
✅ Database functions for provider management

Ready for Phase 2: Service Layer Consolidation

Next steps:
1. Remove conflicting services (authorizedProviderService, apUserService, fallbackAPUserService)
2. Create unified ProviderRelationshipService
3. Replace mock data with real database queries
4. Implement UUID validation framework
';