-- EMERGENCY ROLLBACK: Remove infinite recursion policies
-- Created: 2025-06-23 to fix infinite recursion in profiles table

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "AP users can read profiles" ON profiles;
DROP POLICY IF EXISTS "AP users can create email batch operations" ON email_batch_operations;
DROP POLICY IF EXISTS "AP users can read own email batch operations" ON email_batch_operations;
DROP POLICY IF EXISTS "AP users can update own email batch operations" ON email_batch_operations;

-- Create simple, non-recursive policies
-- Allow users to read their own profile only
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- For email_batch_operations, we'll create policies that don't reference profiles table
-- Allow authenticated users to create email batch operations (we'll handle authorization in app layer)
CREATE POLICY "email_batch_operations_insert_authenticated" ON email_batch_operations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read email batch operations (we'll handle filtering in app layer)
CREATE POLICY "email_batch_operations_select_authenticated" ON email_batch_operations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update email batch operations (we'll handle authorization in app layer)
CREATE POLICY "email_batch_operations_update_authenticated" ON email_batch_operations
  FOR UPDATE USING (auth.uid() IS NOT NULL);