-- Phase 1: Fix Database Schema Issues

-- 1. Add missing status column to student_rosters table
ALTER TABLE public.student_rosters 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE' 
CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT'));

-- Update existing records to have 'ACTIVE' status
UPDATE public.student_rosters 
SET status = 'ACTIVE' 
WHERE status IS NULL;

-- 2. Create compliance_metrics table and records for document types
CREATE TABLE IF NOT EXISTS public.compliance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
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

-- Insert standard compliance metrics for instructor training documents
INSERT INTO public.compliance_metrics (metric_name, metric_type, description, required_for_roles)
VALUES 
    ('Instructor Training Documents', 'document_upload', 'Required training documentation for instructors', ARRAY['IC', 'IP', 'IT']),
    ('Certification Documents', 'document_upload', 'Professional certification documents', ARRAY['IC', 'IP', 'IT', 'AP']),
    ('Safety Training', 'document_upload', 'Safety training completion documents', ARRAY['IC', 'IP', 'IT'])
ON CONFLICT (metric_name) DO NOTHING;

-- 3. Add course_id to student_rosters if it doesn't exist, or fix the relationship
ALTER TABLE public.student_rosters 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_rosters_course_id ON public.student_rosters(course_id);

-- 4. Fix RLS policies causing 406 errors

-- Update authorized_providers RLS policies
DROP POLICY IF EXISTS "Users can view providers and own provider status" ON public.authorized_providers;
CREATE POLICY "Users can view providers and own provider status" 
ON public.authorized_providers 
FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'AP', 'IC', 'IP', 'IT')
    )
);

-- Create user_availability_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_availability_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_availability_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_availability_settings
CREATE POLICY "Users can manage their own availability settings" 
ON public.user_availability_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_availability_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_availability_settings_updated_at
    BEFORE UPDATE ON public.user_availability_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_availability_settings_updated_at();