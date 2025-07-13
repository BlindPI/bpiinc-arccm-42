-- Phase 3A: Team Management Core - Database Schema Updates

-- Team availability permissions for AP users to manage team members
CREATE TABLE IF NOT EXISTS public.team_availability_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level TEXT CHECK (permission_level IN ('view', 'edit', 'full')) DEFAULT 'view' NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(team_id, manager_id)
);

-- Bulk operation queue for team-wide scheduling operations
CREATE TABLE IF NOT EXISTS public.bulk_operation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id TEXT NOT NULL,
    operation_type TEXT CHECK (operation_type IN ('bulk_schedule', 'bulk_update', 'bulk_delete')) NOT NULL,
    target_users UUID[] NOT NULL,
    scheduled_data JSONB NOT NULL DEFAULT '{}',
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_count INTEGER DEFAULT 0,
    total_count INTEGER NOT NULL,
    error_log JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Availability change approvals for workflow management
CREATE TABLE IF NOT EXISTS public.availability_change_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    change_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requested_changes JSONB NOT NULL,
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approval_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Team availability utilization tracking
CREATE TABLE IF NOT EXISTS public.team_utilization_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    metric_date DATE NOT NULL,
    total_available_hours NUMERIC(10,2) DEFAULT 0,
    total_scheduled_hours NUMERIC(10,2) DEFAULT 0,
    utilization_rate NUMERIC(5,2) DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    peak_hours JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(team_id, metric_date)
);

-- Add columns to existing availability_bookings for team management
ALTER TABLE public.availability_bookings 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bulk_operation_id UUID REFERENCES public.bulk_operation_queue(id) ON DELETE SET NULL;

-- Enable RLS for new tables
ALTER TABLE public.team_availability_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_change_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_utilization_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_availability_permissions
CREATE POLICY "AP users can manage team permissions"
ON public.team_availability_permissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD', 'AP')
    )
);

CREATE POLICY "Users can view permissions granted to them"
ON public.team_availability_permissions
FOR SELECT
USING (manager_id = auth.uid());

-- RLS Policies for bulk_operation_queue
CREATE POLICY "Users can view own bulk operations"
ON public.bulk_operation_queue
FOR SELECT
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD')
    )
);

CREATE POLICY "AP users can create bulk operations"
ON public.bulk_operation_queue
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD', 'AP')
    )
);

CREATE POLICY "Creators can update their bulk operations"
ON public.bulk_operation_queue
FOR UPDATE
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD')
    )
);

-- RLS Policies for availability_change_approvals
CREATE POLICY "Users can view their approval requests"
ON public.availability_change_approvals
FOR SELECT
USING (
    user_id = auth.uid() OR 
    approved_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD', 'AP')
    )
);

CREATE POLICY "Users can create approval requests"
ON public.availability_change_approvals
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can update approval status"
ON public.availability_change_approvals
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD', 'AP')
    )
);

-- RLS Policies for team_utilization_metrics
CREATE POLICY "Team managers can view utilization metrics"
ON public.team_utilization_metrics
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE tm.team_id = team_utilization_metrics.team_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'ADMIN' OR p.role IN ('SA', 'AD', 'AP'))
    )
);

CREATE POLICY "System can manage utilization metrics"
ON public.team_utilization_metrics
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('SA', 'AD')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_availability_permissions_team_manager 
ON public.team_availability_permissions(team_id, manager_id);

CREATE INDEX IF NOT EXISTS idx_bulk_operation_queue_status 
ON public.bulk_operation_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_availability_change_approvals_status 
ON public.availability_change_approvals(approval_status, user_id);

CREATE INDEX IF NOT EXISTS idx_team_utilization_metrics_team_date 
ON public.team_utilization_metrics(team_id, metric_date);

-- Function to calculate team utilization metrics
CREATE OR REPLACE FUNCTION public.calculate_team_utilization_metrics(p_team_id UUID, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    total_available NUMERIC := 0;
    total_scheduled NUMERIC := 0;
    member_count INTEGER := 0;
    active_count INTEGER := 0;
BEGIN
    -- Get team member counts
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN tm.status = 'active' THEN 1 END)
    INTO member_count, active_count
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id;
    
    -- Calculate available and scheduled hours for the date
    SELECT 
        COALESCE(SUM(
            CASE WHEN ab.booking_type = 'available' 
            THEN EXTRACT(EPOCH FROM (ab.end_time - ab.start_time)) / 3600 
            ELSE 0 END
        ), 0),
        COALESCE(SUM(
            CASE WHEN ab.booking_type IN ('training', 'course', 'meeting') 
            THEN EXTRACT(EPOCH FROM (ab.end_time - ab.start_time)) / 3600 
            ELSE 0 END
        ), 0)
    INTO total_available, total_scheduled
    FROM public.availability_bookings ab
    JOIN public.team_members tm ON tm.user_id = ab.user_id
    WHERE tm.team_id = p_team_id 
    AND ab.booking_date = p_date
    AND tm.status = 'active';
    
    -- Insert or update metrics
    INSERT INTO public.team_utilization_metrics (
        team_id, metric_date, total_available_hours, total_scheduled_hours,
        utilization_rate, member_count, active_members
    ) VALUES (
        p_team_id, p_date, total_available, total_scheduled,
        CASE WHEN total_available > 0 THEN (total_scheduled / total_available) * 100 ELSE 0 END,
        member_count, active_count
    )
    ON CONFLICT (team_id, metric_date) DO UPDATE SET
        total_available_hours = EXCLUDED.total_available_hours,
        total_scheduled_hours = EXCLUDED.total_scheduled_hours,
        utilization_rate = EXCLUDED.utilization_rate,
        member_count = EXCLUDED.member_count,
        active_members = EXCLUDED.active_members,
        calculated_at = now();
    
    result := jsonb_build_object(
        'team_id', p_team_id,
        'date', p_date,
        'total_available_hours', total_available,
        'total_scheduled_hours', total_scheduled,
        'utilization_rate', CASE WHEN total_available > 0 THEN (total_scheduled / total_available) * 100 ELSE 0 END,
        'member_count', member_count,
        'active_members', active_count
    );
    
    RETURN result;
END;
$$;