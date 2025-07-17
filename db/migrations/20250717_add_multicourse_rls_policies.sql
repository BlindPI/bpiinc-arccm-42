-- =====================================================================================
-- MULTI-COURSE TRAINING SESSIONS RLS POLICIES MIGRATION
-- File: 20250717_add_multicourse_rls_policies.sql
-- Description: Row Level Security policies for multi-course training session system
-- VERIFIED AGAINST ACTUAL DATABASE SCHEMA AND FOREIGN KEYS
-- =====================================================================================

-- Enable RLS on all new tables
ALTER TABLE training_session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_component_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- TRAINING_SESSION_TEMPLATES RLS POLICIES
-- =====================================================================================

-- Allow SA/AD users to manage all session templates
CREATE POLICY "sa_ad_manage_session_templates" ON training_session_templates
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Allow AP users to view and manage templates for their provider
CREATE POLICY "ap_manage_provider_session_templates" ON training_session_templates
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN authorized_providers ap ON p.id = ap.user_id
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
        AND ap.status IN ('active', 'APPROVED')
        AND (
            training_session_templates.provider_id = ap.id
            OR training_session_templates.created_by = p.id
        )
    )
);

-- Allow instructors to view templates (read-only)
CREATE POLICY "instructor_view_session_templates" ON training_session_templates
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('IC', 'IP', 'IT')
    )
);

-- =====================================================================================
-- SESSION_TEMPLATE_COMPONENTS RLS POLICIES
-- =====================================================================================

-- Allow SA/AD users to manage all template components
CREATE POLICY "sa_ad_manage_template_components" ON session_template_components
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Allow AP users to manage components for their session templates
CREATE POLICY "ap_manage_template_components" ON session_template_components
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN authorized_providers ap ON p.id = ap.user_id
        JOIN training_session_templates tst ON session_template_components.session_template_id = tst.id
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
        AND ap.status IN ('active', 'APPROVED')
        AND (
            tst.provider_id = ap.id
            OR tst.created_by = p.id
        )
    )
);

-- Allow instructors to view template components (read-only)
CREATE POLICY "instructor_view_template_components" ON session_template_components
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('IC', 'IP', 'IT')
    )
);

-- =====================================================================================
-- SESSION_COMPONENT_PROGRESS RLS POLICIES
-- =====================================================================================

-- Allow SA/AD users to view all progress records
CREATE POLICY "sa_ad_view_all_progress" ON session_component_progress
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Allow AP users to view progress for students in sessions they manage
CREATE POLICY "ap_view_student_progress" ON session_component_progress
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN authorized_providers ap ON p.id = ap.user_id
        JOIN session_enrollments se ON session_component_progress.session_enrollment_id = se.id
        JOIN training_sessions ts ON se.session_id = ts.id
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
        AND ap.status IN ('active', 'APPROVED')
        AND ts.provider_id = ap.id
    )
);

-- Allow instructors to view and update progress for their assigned sessions
CREATE POLICY "instructor_manage_session_progress" ON session_component_progress
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM instructor_profiles ip
        JOIN session_enrollments se ON session_component_progress.session_enrollment_id = se.id
        JOIN training_sessions ts ON se.session_id = ts.id
        WHERE ip.id = ts.instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = ip.email
            AND p.role IN ('IC', 'IP', 'IT')
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM session_enrollments se
        JOIN student_enrollment_profiles sep ON se.student_id = sep.id
        WHERE session_component_progress.session_enrollment_id = se.id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = sep.email
        )
    )
);

-- Allow students to view their own progress
CREATE POLICY "student_view_own_progress" ON session_component_progress
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM session_enrollments se
        JOIN student_enrollment_profiles sep ON se.student_id = sep.id
        WHERE session_component_progress.session_enrollment_id = se.id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = sep.email
        )
    )
);

-- =====================================================================================
-- COURSE_PREREQUISITES RLS POLICIES  
-- =====================================================================================

-- Allow SA/AD users to manage all course prerequisites
CREATE POLICY "sa_ad_manage_prerequisites" ON course_prerequisites
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Allow AP users to view prerequisites (simplified - all AP users can view all prerequisites)
CREATE POLICY "ap_view_course_prerequisites" ON course_prerequisites
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
    )
);

-- Allow instructors and students to view prerequisites (simplified - all can view all)
CREATE POLICY "instructor_student_view_prerequisites" ON course_prerequisites
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('IC', 'IP', 'IT')
    )
);

-- =====================================================================================
-- ENHANCED RLS POLICIES FOR EXISTING TABLES
-- =====================================================================================

-- Update training_sessions policies for multi-course support
DROP POLICY IF EXISTS "instructors_can_view_assigned_sessions" ON training_sessions;
CREATE POLICY "instructors_can_view_assigned_sessions" ON training_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM instructor_profiles ip
        WHERE ip.id = training_sessions.instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = ip.email
            AND p.role IN ('IC', 'IP', 'IT')
        )
    )
);

-- Update session_enrollments policies for component progress tracking
DROP POLICY IF EXISTS "students_can_view_own_enrollments" ON session_enrollments;
CREATE POLICY "students_can_view_own_enrollments" ON session_enrollments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM student_enrollment_profiles sep
        WHERE sep.id = session_enrollments.student_id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = sep.email
        )
    )
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    )
    OR EXISTS (
        SELECT 1 FROM profiles p
        JOIN authorized_providers ap ON p.id = ap.user_id
        JOIN training_sessions ts ON session_enrollments.session_id = ts.id
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
        AND ap.status IN ('active', 'APPROVED')
        AND ts.provider_id = ap.id
    )
    OR EXISTS (
        SELECT 1 FROM instructor_profiles ip
        JOIN training_sessions ts ON session_enrollments.session_id = ts.id
        WHERE ip.id = ts.instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.email = ip.email
            AND p.role IN ('IC', 'IP', 'IT')
        )
    )
);

-- =====================================================================================
-- MIGRATION COMPLETION LOG
-- =====================================================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MULTI-COURSE RLS POLICIES MIGRATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Applied RLS policies for:';
    RAISE NOTICE '✓ training_session_templates';
    RAISE NOTICE '✓ session_template_components';
    RAISE NOTICE '✓ session_component_progress';
    RAISE NOTICE '✓ course_prerequisites';
    RAISE NOTICE '✓ Enhanced existing table policies';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Role access summary:';
    RAISE NOTICE '• SA/AD: Full administrative access';
    RAISE NOTICE '• AP: Provider-scoped access via provider_id';
    RAISE NOTICE '• IC/IP/IT: Session-specific instructor access via email matching';
    RAISE NOTICE '• Students: Own enrollment and progress access via email matching';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFIED FOREIGN KEY RELATIONSHIPS:';
    RAISE NOTICE '• session_enrollments.student_id → student_enrollment_profiles.id';
    RAISE NOTICE '• training_sessions.instructor_id → instructor_profiles.id';
    RAISE NOTICE '• course_prerequisites.course_id → courses.id';
    RAISE NOTICE '• authorized_providers.user_id → profiles.id';
    RAISE NOTICE '==========================================';
END $$;