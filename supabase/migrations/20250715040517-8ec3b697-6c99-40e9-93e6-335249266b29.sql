-- Phase 1 Continued: Insert compliance metrics and fix remaining schema issues

-- Insert standard compliance metrics for instructor training documents
INSERT INTO public.compliance_metrics (metric_name, metric_type, description, required_for_roles)
VALUES 
    ('Instructor Training Documents', 'document_upload', 'Required training documentation for instructors', ARRAY['IC', 'IP', 'IT']),
    ('Certification Documents', 'document_upload', 'Professional certification documents', ARRAY['IC', 'IP', 'IT', 'AP']),
    ('Safety Training', 'document_upload', 'Safety training completion documents', ARRAY['IC', 'IP', 'IT'])
ON CONFLICT (metric_name) DO NOTHING;

-- 3. Add course_id to student_rosters if it doesn't exist
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