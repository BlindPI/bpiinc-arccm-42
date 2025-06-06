-- Migration: Create missing tables for production readiness
-- Date: 2025-06-06
-- Purpose: Add locations and compliance_issues tables with proper RLS

-- First, check if tables exist and drop them if they do (for clean migration)
DROP TABLE IF EXISTS public.compliance_issues CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- Create locations table
CREATE TABLE public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create compliance_issues table
CREATE TABLE public.compliance_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    location_id UUID REFERENCES public.locations(id),
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add location_id to existing tables if not exists (safe approach)
DO $$
BEGIN
    -- Add location_id to teams table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'teams'
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN location_id UUID REFERENCES public.locations(id);
    END IF;

    -- Add location_id to certificates table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'certificates'
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE public.certificates ADD COLUMN location_id UUID REFERENCES public.locations(id);
    END IF;

    -- Add location_id to profiles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN location_id UUID REFERENCES public.locations(id);
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_issues ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for new tables
DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_issues_updated_at ON public.compliance_issues;
CREATE TRIGGER update_compliance_issues_updated_at
    BEFORE UPDATE ON public.compliance_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indices for performance (after tables are created)
CREATE INDEX IF NOT EXISTS locations_active_idx ON public.locations(is_active);
CREATE INDEX IF NOT EXISTS locations_created_by_idx ON public.locations(created_by);
CREATE INDEX IF NOT EXISTS locations_name_idx ON public.locations(name);

CREATE INDEX IF NOT EXISTS compliance_issues_user_location_idx ON public.compliance_issues(user_id, location_id);
CREATE INDEX IF NOT EXISTS compliance_issues_status_idx ON public.compliance_issues(status);
CREATE INDEX IF NOT EXISTS compliance_issues_severity_idx ON public.compliance_issues(severity);
CREATE INDEX IF NOT EXISTS compliance_issues_due_date_idx ON public.compliance_issues(due_date);

-- Create indices for foreign key columns (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
        CREATE INDEX IF NOT EXISTS teams_location_idx ON public.teams(location_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
        CREATE INDEX IF NOT EXISTS certificates_location_idx ON public.certificates(location_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles(location_id);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.locations IS 'Physical locations where teams operate';
COMMENT ON TABLE public.compliance_issues IS 'Compliance issues and violations tracking';

-- Add column comments (safe approach)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
        COMMENT ON COLUMN public.teams.location_id IS 'Location where this team operates';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
        COMMENT ON COLUMN public.certificates.location_id IS 'Location where certificate was issued';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        COMMENT ON COLUMN public.profiles.location_id IS 'Primary location for this user';
    END IF;
END $$;