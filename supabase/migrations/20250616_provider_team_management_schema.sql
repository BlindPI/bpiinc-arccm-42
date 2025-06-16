-- Provider Team Management Schema Enhancement
-- Stage 1: Database Schema for Provider Team Management

-- Provider team assignments table
CREATE TABLE IF NOT EXISTS public.provider_team_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    assignment_role VARCHAR(50) NOT NULL, -- 'primary_trainer', 'support_trainer', 'supervisor', 'coordinator'
    oversight_level VARCHAR(20) NOT NULL, -- 'monitor', 'manage', 'admin'
    assignment_type VARCHAR(30) DEFAULT 'ongoing', -- 'ongoing', 'project_based', 'temporary'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, team_id, assignment_role)
);

-- Provider training capabilities
CREATE TABLE IF NOT EXISTS public.provider_training_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    course_category VARCHAR(100) NOT NULL,
    certification_types TEXT[], -- Array of certification types they can deliver
    max_team_size INTEGER DEFAULT 20,
    location_restrictions TEXT[], -- Array of location IDs they can serve
    equipment_requirements JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider team performance tracking
CREATE TABLE IF NOT EXISTS public.provider_team_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id),
    team_id UUID REFERENCES public.teams(id),
    measurement_period DATE NOT NULL, -- Monthly snapshots
    courses_delivered INTEGER DEFAULT 0,
    certifications_issued INTEGER DEFAULT 0,
    average_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    compliance_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, team_id, measurement_period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_provider_id ON public.provider_team_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_team_id ON public.provider_team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_status ON public.provider_team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_provider_training_capabilities_provider_id ON public.provider_training_capabilities(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_performance_provider_id ON public.provider_team_performance(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_performance_team_id ON public.provider_team_performance(team_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_performance_period ON public.provider_team_performance(measurement_period);

-- Enable RLS on new tables
ALTER TABLE public.provider_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_training_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_team_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_team_assignments
CREATE POLICY "Users can view provider team assignments" ON public.provider_team_assignments
FOR SELECT USING (true);

CREATE POLICY "SA and AD can manage provider team assignments" ON public.provider_team_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS Policies for provider_training_capabilities
CREATE POLICY "Users can view provider capabilities" ON public.provider_training_capabilities
FOR SELECT USING (true);

CREATE POLICY "SA and AD can manage provider capabilities" ON public.provider_training_capabilities
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS Policies for provider_team_performance
CREATE POLICY "Users can view provider performance" ON public.provider_team_performance
FOR SELECT USING (true);

CREATE POLICY "SA and AD can manage provider performance" ON public.provider_team_performance
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Grant permissions
GRANT SELECT ON public.provider_team_assignments TO authenticated;
GRANT SELECT ON public.provider_training_capabilities TO authenticated;
GRANT SELECT ON public.provider_team_performance TO authenticated;

-- Function to assign provider to team with validation
CREATE OR REPLACE FUNCTION public.assign_provider_to_team(
    p_provider_id UUID,
    p_team_id UUID,
    p_assignment_role VARCHAR(50),
    p_oversight_level VARCHAR(20),
    p_assignment_type VARCHAR(30) DEFAULT 'ongoing',
    p_end_date DATE DEFAULT NULL,
    p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
    provider_exists BOOLEAN;
    team_exists BOOLEAN;
BEGIN
    -- Validate provider exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.providers 
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
        p_assigned_by
    )
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;

-- Function to get provider team assignments with details
CREATE OR REPLACE FUNCTION public.get_provider_team_assignments(p_provider_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    team_id UUID,
    team_name VARCHAR(255),
    assignment_role VARCHAR(50),
    oversight_level VARCHAR(20),
    assignment_type VARCHAR(30),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    team_status VARCHAR(20),
    location_name VARCHAR(255),
    member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pta.id as assignment_id,
        pta.team_id,
        t.name as team_name,
        pta.assignment_role,
        pta.oversight_level,
        pta.assignment_type,
        pta.start_date,
        pta.end_date,
        pta.status,
        t.status as team_status,
        l.name as location_name,
        COALESCE(tm.member_count, 0) as member_count
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

-- Function to record provider team performance
CREATE OR REPLACE FUNCTION public.record_provider_team_performance(
    p_provider_id UUID,
    p_team_id UUID,
    p_measurement_period DATE,
    p_courses_delivered INTEGER DEFAULT 0,
    p_certifications_issued INTEGER DEFAULT 0,
    p_average_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    p_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    p_compliance_score DECIMAL(5,2) DEFAULT 0.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    performance_id UUID;
BEGIN
    -- Insert or update performance record
    INSERT INTO public.provider_team_performance (
        provider_id,
        team_id,
        measurement_period,
        courses_delivered,
        certifications_issued,
        average_satisfaction_score,
        completion_rate,
        compliance_score
    ) VALUES (
        p_provider_id,
        p_team_id,
        p_measurement_period,
        p_courses_delivered,
        p_certifications_issued,
        p_average_satisfaction_score,
        p_completion_rate,
        p_compliance_score
    )
    ON CONFLICT (provider_id, team_id, measurement_period)
    DO UPDATE SET
        courses_delivered = EXCLUDED.courses_delivered,
        certifications_issued = EXCLUDED.certifications_issued,
        average_satisfaction_score = EXCLUDED.average_satisfaction_score,
        completion_rate = EXCLUDED.completion_rate,
        compliance_score = EXCLUDED.compliance_score,
        created_at = NOW()
    RETURNING id INTO performance_id;
    
    RETURN performance_id;
END;
$$;

-- Add sample data for testing
DO $$
BEGIN
    -- Add sample training capabilities for existing providers
    IF EXISTS (SELECT 1 FROM public.providers LIMIT 1) THEN
        INSERT INTO public.provider_training_capabilities (
            provider_id,
            course_category,
            certification_types,
            max_team_size,
            equipment_requirements
        )
        SELECT 
            p.id,
            'Safety Training',
            ARRAY['First Aid', 'CPR', 'Workplace Safety'],
            25,
            '{"projector": true, "training_materials": true, "certification_printer": true}'::jsonb
        FROM public.providers p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.provider_training_capabilities ptc 
            WHERE ptc.provider_id = p.id
        )
        LIMIT 3;
        
        RAISE NOTICE 'Added sample provider training capabilities';
    END IF;
END;
$$;