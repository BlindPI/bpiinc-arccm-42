-- Drop Conflicting Functions First
-- This migration specifically handles the function conflicts

-- Drop all conflicting functions with their exact signatures
DROP FUNCTION IF EXISTS public.get_available_ap_users_for_location(uuid);
DROP FUNCTION IF EXISTS public.get_ap_user_assignments(uuid);
DROP FUNCTION IF EXISTS public.assign_ap_user_to_location(uuid, uuid, varchar, date);
DROP FUNCTION IF EXISTS public.remove_ap_user_from_location(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_provider_team_assignments_detailed(uuid);

-- Also drop any variations that might exist
DROP FUNCTION IF EXISTS public.get_available_ap_users_for_location(text);
DROP FUNCTION IF EXISTS public.get_ap_user_assignments(text);
DROP FUNCTION IF EXISTS public.assign_ap_user_to_location(text, text, varchar, date);
DROP FUNCTION IF EXISTS public.remove_ap_user_from_location(text, text);
DROP FUNCTION IF EXISTS public.get_provider_team_assignments_detailed(text);

-- Drop functions without parameters if they exist
DROP FUNCTION IF EXISTS public.get_available_ap_users_for_location();
DROP FUNCTION IF EXISTS public.get_ap_user_assignments();

-- Create a simple test function to verify this migration worked
CREATE OR REPLACE FUNCTION public.test_migration_success()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Migration successful - conflicting functions dropped';
END;
$$;