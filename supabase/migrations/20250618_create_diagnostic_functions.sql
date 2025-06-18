-- Create diagnostic functions for CRM system analysis
-- This migration adds utility functions to help diagnose CRM issues

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table column information
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT, is_nullable TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
    AND c.table_name = $1
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table row count safely
CREATE OR REPLACE FUNCTION get_table_count(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    row_count INTEGER;
    query_text TEXT;
BEGIN
    -- Check if table exists first
    IF NOT check_table_exists(table_name) THEN
        RETURN -1; -- Indicates table doesn't exist
    END IF;
    
    -- Build dynamic query
    query_text := format('SELECT COUNT(*) FROM public.%I', table_name);
    
    -- Execute and get count
    EXECUTE query_text INTO row_count;
    
    RETURN row_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN -2; -- Indicates error occurred
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test basic CRM table operations
CREATE OR REPLACE FUNCTION test_crm_table_access()
RETURNS TABLE(
    table_name TEXT,
    exists BOOLEAN,
    accessible BOOLEAN,
    row_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    tables TEXT[] := ARRAY[
        'crm_leads',
        'crm_opportunities', 
        'crm_activities',
        'crm_tasks',
        'crm_contacts',
        'crm_accounts',
        'crm_email_campaigns',
        'email_campaigns',
        'email_templates',
        'campaign_metrics',
        'crm_pipeline_stages',
        'crm_revenue_records',
        'crm_lead_scoring_rules',
        'crm_assignment_rules',
        'crm_analytics_cache'
    ];
    tbl TEXT;
    tbl_exists BOOLEAN;
    tbl_accessible BOOLEAN;
    tbl_count INTEGER;
    err_msg TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Reset variables
        tbl_exists := FALSE;
        tbl_accessible := FALSE;
        tbl_count := 0;
        err_msg := NULL;
        
        BEGIN
            -- Check if table exists
            tbl_exists := check_table_exists(tbl);
            
            IF tbl_exists THEN
                -- Try to access table
                tbl_count := get_table_count(tbl);
                
                IF tbl_count >= 0 THEN
                    tbl_accessible := TRUE;
                ELSE
                    tbl_accessible := FALSE;
                    err_msg := 'Table exists but not accessible';
                END IF;
            ELSE
                err_msg := 'Table does not exist';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                err_msg := SQLERRM;
                tbl_accessible := FALSE;
        END;
        
        -- Return row for this table
        table_name := tbl;
        exists := tbl_exists;
        accessible := tbl_accessible;
        row_count := COALESCE(tbl_count, 0);
        error_message := err_msg;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION test_crm_table_access() TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION check_table_exists(TEXT) IS 'Check if a table exists in the public schema';
COMMENT ON FUNCTION get_table_columns(TEXT) IS 'Get column information for a table';
COMMENT ON FUNCTION get_table_count(TEXT) IS 'Get row count for a table safely';
COMMENT ON FUNCTION test_crm_table_access() IS 'Test access to all CRM-related tables';