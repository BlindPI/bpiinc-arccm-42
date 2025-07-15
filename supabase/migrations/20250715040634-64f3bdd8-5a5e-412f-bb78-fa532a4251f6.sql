-- Phase 1 Fixed: Insert compliance metrics using correct column names

-- Insert standard compliance metrics for instructor training documents
INSERT INTO public.compliance_metrics (name, description, category, required_for_roles, measurement_type, is_active)
VALUES 
    ('Instructor Training Documents', 'Required training documentation for instructors', 'document_upload', ARRAY['IC', 'IP', 'IT'], 'document_count', true),
    ('Certification Documents', 'Professional certification documents', 'document_upload', ARRAY['IC', 'IP', 'IT', 'AP'], 'document_count', true),
    ('Safety Training', 'Safety training completion documents', 'document_upload', ARRAY['IC', 'IP', 'IT'], 'document_count', true)
ON CONFLICT (name) DO NOTHING;

-- Fix remaining schema issues

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