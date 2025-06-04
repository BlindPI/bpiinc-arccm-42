-- Final fix for crm_pipeline_stages table
-- This script handles duplicate data and ensures proper table structure

-- First, let's see what's currently in the table
SELECT * FROM crm_pipeline_stages ORDER BY stage_order;

-- Clean up any duplicate or problematic data
DELETE FROM crm_pipeline_stages;

-- Add missing columns one by one if they don't exist
DO $$ 
BEGIN
    -- Add stage_description column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'stage_description'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN stage_description TEXT;
    END IF;
    
    -- Add probability_percentage column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'probability_percentage'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN probability_percentage INTEGER DEFAULT 50 CHECK (probability_percentage >= 0 AND probability_percentage <= 100);
    END IF;
    
    -- Add is_active column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add stage_color column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'stage_color'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN stage_color VARCHAR(7) DEFAULT '#3b82f6';
    END IF;
    
    -- Add created_by column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add created_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_pipeline_stages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Now add unique constraint on stage_order (after cleaning data)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'crm_pipeline_stages' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%stage_order%'
    ) THEN
        ALTER TABLE crm_pipeline_stages ADD CONSTRAINT crm_pipeline_stages_stage_order_key UNIQUE(stage_order);
    END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_crm_pipeline_stages_updated_at'
    ) THEN
        -- First ensure the function exists
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Then create the trigger
        CREATE TRIGGER update_crm_pipeline_stages_updated_at 
        BEFORE UPDATE ON crm_pipeline_stages 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert the default pipeline stages (fresh data)
INSERT INTO crm_pipeline_stages (stage_name, stage_description, stage_order, probability_percentage, stage_color) VALUES
('Qualified Lead', 'Initial qualified lead with basic information', 1, 10, '#ef4444'),
('Needs Analysis', 'Understanding specific training requirements', 2, 25, '#f97316'),
('Proposal Sent', 'Formal proposal has been submitted', 3, 50, '#eab308'),
('Negotiation', 'Discussing terms and finalizing details', 4, 75, '#22c55e'),
('Closed Won', 'Successfully closed opportunity', 5, 100, '#10b981'),
('Closed Lost', 'Opportunity was not successful', 6, 0, '#6b7280');

-- Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'crm_pipeline_stages' 
ORDER BY ordinal_position;

-- Verify the data was inserted correctly
SELECT id, stage_name, stage_description, stage_order, probability_percentage, stage_color, is_active
FROM crm_pipeline_stages 
ORDER BY stage_order;

-- Show success message
SELECT 'CRM Pipeline Stages table successfully configured!' as status;