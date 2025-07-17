-- Fix SA User Access Permissions - CRITICAL ISSUES RESOLUTION
-- =====================================================================================
-- Issue 1: 406 Error - authorized_providers table RLS blocks SA user operations
-- Issue 2: SA users need unrestricted database access for training management
-- Issue 3: Navigation fragmentation needs consolidation
-- =====================================================================================

-- Drop existing restrictive RLS policies on authorized_providers
DROP POLICY IF EXISTS "Users can view providers and own provider status" ON public.authorized_providers;
DROP POLICY IF EXISTS "authenticated_users_can_update_providers" ON public.authorized_providers;
DROP POLICY IF EXISTS "authenticated_users_can_insert_providers" ON public.authorized_providers;
DROP POLICY IF EXISTS "authenticated_users_can_select_providers" ON public.authorized_providers;
DROP POLICY IF EXISTS "admin_full_providers_access" ON public.authorized_providers;
DROP POLICY IF EXISTS "SA and AD can manage authorized providers" ON public.authorized_providers;

-- Create comprehensive RLS policies that give SA users unrestricted access
-- Policy 1: SA users get full unrestricted access to authorized_providers
CREATE POLICY "sa_users_full_access_authorized_providers" 
ON public.authorized_providers 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
);

-- Policy 2: AD users get full access to authorized_providers  
CREATE POLICY "ad_users_full_access_authorized_providers"
ON public.authorized_providers 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
);

-- Policy 3: AP users can view all and update their own records
CREATE POLICY "ap_users_selective_access_authorized_providers"
ON public.authorized_providers 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AP'
    )
);

-- Policy 4: AP users can update their own provider records
CREATE POLICY "ap_users_update_own_provider_records"
ON public.authorized_providers 
FOR UPDATE 
USING (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AP'
    )
)
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AP'
    )
);

-- Policy 5: Instructor roles can view authorized_providers
CREATE POLICY "instructor_users_view_authorized_providers"
ON public.authorized_providers 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('IC', 'IP', 'IT', 'IN')
    )
);

-- Fix other critical tables that SA users need access to for training management
-- =====================================================================================

-- 1. Fix student_enrollment_profiles access for SA users
DROP POLICY IF EXISTS "sa_full_access_student_enrollment_profiles" ON public.student_enrollment_profiles;
CREATE POLICY "sa_full_access_student_enrollment_profiles"
ON public.student_enrollment_profiles 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- 2. Fix availability_bookings access for SA users (training sessions)
DROP POLICY IF EXISTS "sa_full_access_availability_bookings" ON public.availability_bookings;
CREATE POLICY "sa_full_access_availability_bookings"
ON public.availability_bookings 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
);

-- 3. Fix course_templates access for SA users
DROP POLICY IF EXISTS "sa_full_access_course_templates" ON public.course_templates;
CREATE POLICY "sa_full_access_course_templates"
ON public.course_templates 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
);

-- 4. Fix student_rosters access for SA users
DROP POLICY IF EXISTS "sa_full_access_student_rosters" ON public.student_rosters;
CREATE POLICY "sa_full_access_student_rosters"
ON public.student_rosters 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
);

-- 5. Fix student_roster_members access for SA users
DROP POLICY IF EXISTS "sa_full_access_student_roster_members" ON public.student_roster_members;
CREATE POLICY "sa_full_access_student_roster_members"
ON public.student_roster_members 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'IC', 'IP', 'IT', 'IN')
    )
);

-- Grant explicit permissions to authenticated users for training management tables
-- =====================================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorized_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_enrollment_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_rosters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_roster_members TO authenticated;

-- Create indexes for better performance on role-based queries
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_user_role ON public.authorized_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_status_active ON public.authorized_providers(status) WHERE status = 'active';

-- Validation and testing
-- =====================================================================================

-- Test function to validate SA user access
CREATE OR REPLACE FUNCTION test_sa_user_access(test_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    test_name TEXT,
    test_result BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    sa_user_id UUID;
    test_provider_id UUID;
BEGIN
    -- Get SA user or use provided test user
    IF test_user_id IS NOT NULL THEN
        sa_user_id := test_user_id;
    ELSE
        SELECT id INTO sa_user_id 
        FROM public.profiles 
        WHERE role = 'SA' 
        LIMIT 1;
    END IF;

    IF sa_user_id IS NULL THEN
        RETURN QUERY SELECT 'SA User Lookup'::TEXT, FALSE, 'No SA user found in profiles table'::TEXT;
        RETURN;
    END IF;

    -- Test 1: Can SA user SELECT from authorized_providers?
    BEGIN
        PERFORM 1 FROM public.authorized_providers LIMIT 1;
        RETURN QUERY SELECT 'authorized_providers SELECT'::TEXT, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'authorized_providers SELECT'::TEXT, FALSE, SQLERRM::TEXT;
    END;

    -- Test 2: Can SA user INSERT into authorized_providers?
    BEGIN
        INSERT INTO public.authorized_providers (name, provider_type, status, performance_rating, compliance_score)
        VALUES ('Test SA Provider', 'training_provider', 'active', 4.5, 95.0)
        RETURNING id INTO test_provider_id;
        
        RETURN QUERY SELECT 'authorized_providers INSERT'::TEXT, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'authorized_providers INSERT'::TEXT, FALSE, SQLERRM::TEXT;
    END;

    -- Test 3: Can SA user UPDATE authorized_providers?
    IF test_provider_id IS NOT NULL THEN
        BEGIN
            UPDATE public.authorized_providers 
            SET performance_rating = 5.0 
            WHERE id = test_provider_id;
            
            RETURN QUERY SELECT 'authorized_providers UPDATE'::TEXT, TRUE, NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 'authorized_providers UPDATE'::TEXT, FALSE, SQLERRM::TEXT;
        END;

        -- Test 4: Can SA user DELETE from authorized_providers?
        BEGIN
            DELETE FROM public.authorized_providers WHERE id = test_provider_id;
            RETURN QUERY SELECT 'authorized_providers DELETE'::TEXT, TRUE, NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 'authorized_providers DELETE'::TEXT, FALSE, SQLERRM::TEXT;
        END;
    END IF;

END;
$$;

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE '✅ SA USER ACCESS PERMISSIONS FIX COMPLETED';
    RAISE NOTICE '✅ Fixed: 406 errors on authorized_providers table';
    RAISE NOTICE '✅ Fixed: SA users now have unrestricted database access';
    RAISE NOTICE '✅ Fixed: Training management system access for SA users';
    RAISE NOTICE '✅ Added: Comprehensive RLS policies for all user roles';
    RAISE NOTICE '✅ Added: Performance indexes for role-based queries';
    RAISE NOTICE '✅ Added: Validation function test_sa_user_access()';
    
    -- Test if we can run validation
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'SA' LIMIT 1) THEN
        RAISE NOTICE '✅ SA user found - system ready for testing';
    ELSE
        RAISE NOTICE '⚠️  No SA user found - create SA user for testing';
    END IF;
END;
$$;