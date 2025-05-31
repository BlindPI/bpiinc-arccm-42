
-- Drop and recreate the get_current_user_role function with better error handling
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a more robust security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get the current user ID from auth context
  current_user_id := auth.uid();
  
  -- If no authenticated user, return null
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's role from profiles table
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = current_user_id
  LIMIT 1;
  
  -- Return the role (could be null if profile doesn't exist)
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return null to prevent policy failures
    RAISE WARNING 'Error in get_current_user_role(): %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
