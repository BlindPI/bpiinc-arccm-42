-- Compliance Management System
-- Real functional compliance tracking with admin controls

-- =============================================================================
-- STEP 1: Create Compliance Metrics Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'certification', 'training', 'safety', 'documentation', 'equipment'
    required_for_roles TEXT[] DEFAULT '{}', -- Array of roles that need this metric
    measurement_type VARCHAR(50) NOT NULL DEFAULT 'boolean', -- 'boolean', 'percentage', 'date', 'numeric'
    target_value JSONB, -- Target value for compliance (varies by measurement_type)
    weight INTEGER DEFAULT 1, -- Weight for overall compliance score calculation
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create User Compliance Records Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_compliance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.compliance_metrics(id) ON DELETE CASCADE,
    current_value JSONB, -- Current value (varies by measurement_type)
    compliance_status VARCHAR(20) DEFAULT 'pending' CHECK (compliance_status IN ('compliant', 'non_compliant', 'warning', 'pending')),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    next_check_due TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_id)
);

-- =============================================================================
-- STEP 3: Create Compliance Actions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.compliance_metrics(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'required', 'recommended', 'overdue'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'dismissed')),
    assigned_by UUID REFERENCES public.profiles(id),
    completed_by UUID REFERENCES public.profiles(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 4: Create Compliance Audit Log Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_id UUID REFERENCES public.compliance_metrics(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL, -- 'manual_check', 'automatic_check', 'status_change', 'metric_update'
    old_value JSONB,
    new_value JSONB,
    performed_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 5: Enable RLS
-- =============================================================================

ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 6: Create RLS Policies
-- =============================================================================

-- Compliance Metrics - SA/AD can manage, others can view
DROP POLICY IF EXISTS "admin_full_compliance_metrics_access" ON public.compliance_metrics;
CREATE POLICY "admin_full_compliance_metrics_access" ON public.compliance_metrics
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_compliance_metrics" ON public.compliance_metrics;
CREATE POLICY "users_view_compliance_metrics" ON public.compliance_metrics
FOR SELECT USING (is_active = true);

-- User Compliance Records - Users can view their own, SA/AD can view all
DROP POLICY IF EXISTS "admin_full_compliance_records_access" ON public.user_compliance_records;
CREATE POLICY "admin_full_compliance_records_access" ON public.user_compliance_records
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_own_compliance_records" ON public.user_compliance_records;
CREATE POLICY "users_view_own_compliance_records" ON public.user_compliance_records
FOR SELECT USING (user_id = auth.uid());

-- Compliance Actions - Similar access pattern
DROP POLICY IF EXISTS "admin_full_compliance_actions_access" ON public.compliance_actions;
CREATE POLICY "admin_full_compliance_actions_access" ON public.compliance_actions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_own_compliance_actions" ON public.compliance_actions;
CREATE POLICY "users_view_own_compliance_actions" ON public.compliance_actions
FOR SELECT USING (user_id = auth.uid());

-- Audit Log - SA/AD can view all, users can view their own
DROP POLICY IF EXISTS "admin_view_compliance_audit_log" ON public.compliance_audit_log;
CREATE POLICY "admin_view_compliance_audit_log" ON public.compliance_audit_log
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_view_own_compliance_audit_log" ON public.compliance_audit_log;
CREATE POLICY "users_view_own_compliance_audit_log" ON public.compliance_audit_log
FOR SELECT USING (user_id = auth.uid());

-- =============================================================================
-- STEP 7: Create Compliance Management Functions
-- =============================================================================

-- Function to calculate user compliance score
CREATE OR REPLACE FUNCTION calculate_user_compliance_score(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    total_weight INTEGER := 0;
    weighted_score NUMERIC := 0;
    metric_record RECORD;
BEGIN
    -- Get all applicable metrics for the user's role
    FOR metric_record IN
        SELECT cm.id, cm.weight, ucr.compliance_status
        FROM public.compliance_metrics cm
        LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id AND ucr.user_id = p_user_id
        JOIN public.profiles p ON p.id = p_user_id
        WHERE cm.is_active = true
        AND (cm.required_for_roles = '{}' OR p.role = ANY(cm.required_for_roles))
    LOOP
        total_weight := total_weight + metric_record.weight;
        
        CASE metric_record.compliance_status
            WHEN 'compliant' THEN
                weighted_score := weighted_score + (metric_record.weight * 100);
            WHEN 'warning' THEN
                weighted_score := weighted_score + (metric_record.weight * 75);
            WHEN 'non_compliant' THEN
                weighted_score := weighted_score + (metric_record.weight * 0);
            ELSE -- pending or null
                weighted_score := weighted_score + (metric_record.weight * 50);
        END CASE;
    END LOOP;
    
    IF total_weight = 0 THEN
        RETURN 100; -- No applicable metrics
    END IF;
    
    RETURN ROUND(weighted_score / total_weight, 2);
END;
$$;

-- Function to get user compliance summary
CREATE OR REPLACE FUNCTION get_user_compliance_summary(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    overall_score NUMERIC,
    total_metrics INTEGER,
    compliant_count INTEGER,
    warning_count INTEGER,
    non_compliant_count INTEGER,
    pending_count INTEGER,
    overdue_actions INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_user_id,
        calculate_user_compliance_score(p_user_id),
        COUNT(cm.id)::INTEGER as total_metrics,
        COUNT(CASE WHEN ucr.compliance_status = 'compliant' THEN 1 END)::INTEGER as compliant_count,
        COUNT(CASE WHEN ucr.compliance_status = 'warning' THEN 1 END)::INTEGER as warning_count,
        COUNT(CASE WHEN ucr.compliance_status = 'non_compliant' THEN 1 END)::INTEGER as non_compliant_count,
        COUNT(CASE WHEN ucr.compliance_status = 'pending' OR ucr.compliance_status IS NULL THEN 1 END)::INTEGER as pending_count,
        (SELECT COUNT(*)::INTEGER FROM public.compliance_actions ca 
         WHERE ca.user_id = p_user_id AND ca.status = 'open' AND ca.due_date < CURRENT_DATE) as overdue_actions
    FROM public.compliance_metrics cm
    LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id AND ucr.user_id = p_user_id
    JOIN public.profiles p ON p.id = p_user_id
    WHERE cm.is_active = true
    AND (cm.required_for_roles = '{}' OR p.role = ANY(cm.required_for_roles));
END;
$$;

-- Function to update compliance record
CREATE OR REPLACE FUNCTION update_compliance_record(
    p_user_id UUID,
    p_metric_id UUID,
    p_current_value JSONB,
    p_compliance_status VARCHAR(20),
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    record_id UUID;
    old_value JSONB;
BEGIN
    -- Get old value for audit log
    SELECT current_value INTO old_value
    FROM public.user_compliance_records
    WHERE user_id = p_user_id AND metric_id = p_metric_id;
    
    -- Upsert compliance record
    INSERT INTO public.user_compliance_records (
        user_id, metric_id, current_value, compliance_status, 
        last_checked_at, notes, verified_by, verified_at
    ) VALUES (
        p_user_id, p_metric_id, p_current_value, p_compliance_status,
        NOW(), p_notes, auth.uid(), NOW()
    )
    ON CONFLICT (user_id, metric_id) 
    DO UPDATE SET
        current_value = EXCLUDED.current_value,
        compliance_status = EXCLUDED.compliance_status,
        last_checked_at = EXCLUDED.last_checked_at,
        notes = EXCLUDED.notes,
        verified_by = EXCLUDED.verified_by,
        verified_at = EXCLUDED.verified_at,
        updated_at = NOW()
    RETURNING id INTO record_id;
    
    -- Log the change
    INSERT INTO public.compliance_audit_log (
        user_id, metric_id, audit_type, old_value, new_value, performed_by
    ) VALUES (
        p_user_id, p_metric_id, 'status_change', old_value, p_current_value, auth.uid()
    );
    
    RETURN record_id;
END;
$$;

-- =============================================================================
-- STEP 8: Insert Default Compliance Metrics
-- =============================================================================

INSERT INTO public.compliance_metrics (name, description, category, required_for_roles, measurement_type, target_value, weight) VALUES
('CPR/AED Certification', 'Current CPR and AED certification required for all instructors', 'certification', '{"AP", "IN"}', 'date', '{"valid_until": "required"}', 3),
('First Aid Certification', 'Current First Aid certification required for all instructors', 'certification', '{"AP", "IN"}', 'date', '{"valid_until": "required"}', 3),
('Background Check', 'Background check completed within last 2 years', 'documentation', '{"AP", "IN"}', 'date', '{"valid_until": "required"}', 2),
('Safety Training Completion', 'Annual safety training completion', 'training', '{"AP", "IN", "TM"}', 'boolean', '{"completed": true}', 2),
('Equipment Inspection', 'Monthly equipment safety inspection', 'equipment', '{"AP"}', 'date', '{"last_inspection": "monthly"}', 1),
('Insurance Coverage', 'Valid liability insurance coverage', 'documentation', '{"AP"}', 'boolean', '{"active": true}', 3),
('Training Records', 'Complete and up-to-date training records', 'documentation', '{"AP", "IN"}', 'percentage', '{"completeness": 95}', 2),
('OSHA Compliance', 'OSHA safety standards compliance', 'safety', '{"AP"}', 'boolean', '{"compliant": true}', 2)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 9: Create Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_category ON public.compliance_metrics(category);
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_roles ON public.compliance_metrics USING GIN(required_for_roles);
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_user_id ON public.user_compliance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_status ON public.user_compliance_records(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_user_id ON public.compliance_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_status ON public.compliance_actions(status);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_due_date ON public.compliance_actions(due_date);

-- =============================================================================
-- STEP 10: Grant Permissions
-- =============================================================================

GRANT SELECT ON public.compliance_metrics TO authenticated;
GRANT SELECT ON public.user_compliance_records TO authenticated;
GRANT SELECT ON public.compliance_actions TO authenticated;
GRANT SELECT ON public.compliance_audit_log TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.compliance_metrics TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_compliance_records TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.compliance_actions TO authenticated;
GRANT INSERT ON public.compliance_audit_log TO authenticated;

RAISE NOTICE 'Compliance Management System created successfully!';
RAISE NOTICE 'Created tables: compliance_metrics, user_compliance_records, compliance_actions, compliance_audit_log';
RAISE NOTICE 'Created functions: calculate_user_compliance_score, get_user_compliance_summary, update_compliance_record';
RAISE NOTICE 'Inserted 8 default compliance metrics for different roles';