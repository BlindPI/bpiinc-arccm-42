-- Fix RLS policies using public schema functions to avoid infinite recursion
-- This approach uses a security definer function to check user roles

-- Create a security definer function to check if current user has admin privileges
-- This function will bypass RLS when checking roles to avoid recursion
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query to profiles table with RLS bypassed via SECURITY DEFINER
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role IN ('SA', 'AD'), FALSE);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return FALSE for security
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- Drop the temporary policy
DROP POLICY IF EXISTS "profiles_temp_authenticated_access" ON profiles;

-- Create new policies using the security definer function
CREATE POLICY "profiles_select_with_admin_check" ON profiles
  FOR SELECT USING (
    -- Users can read their own profile OR admins can read all profiles
    auth.uid() = id OR public.current_user_is_admin()
  );

CREATE POLICY "profiles_update_with_admin_check" ON profiles
  FOR UPDATE USING (
    -- Users can update their own profile OR admins can update all profiles
    auth.uid() = id OR public.current_user_is_admin()
  );

CREATE POLICY "profiles_insert_with_admin_check" ON profiles
  FOR INSERT WITH CHECK (
    -- Users can insert their own profile OR admins can insert any profile
    auth.uid() = id OR public.current_user_is_admin()
  );

-- Create a policy for delete operations (only admins)
CREATE POLICY "profiles_delete_admin_only" ON profiles
  FOR DELETE USING (public.current_user_is_admin());