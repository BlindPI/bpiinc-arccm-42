-- Phase 1: Fix Database Schema Issues (Corrected)

-- 1. Add missing status column to student_rosters table
ALTER TABLE public.student_rosters 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE' 
CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT'));

-- Update existing records to have 'ACTIVE' status
UPDATE public.student_rosters 
SET status = 'ACTIVE' 
WHERE status IS NULL;

-- 2. Create compliance_metrics table first, then insert records
CREATE TABLE IF NOT EXISTS public.compliance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL UNIQUE,
    metric_type TEXT NOT NULL,
    description TEXT,
    required_for_roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for compliance_metrics
CREATE POLICY "Everyone can view active compliance metrics" 
ON public.compliance_metrics 
FOR SELECT 
USING (is_active = true);