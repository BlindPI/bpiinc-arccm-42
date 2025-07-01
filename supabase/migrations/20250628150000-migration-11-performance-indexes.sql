
-- Migration 11: Create performance indexes
-- Comprehensive performance optimization based on usage patterns and query analysis

-- Phase 1: High-Activity Table Optimization
-- Certificate requests (heavy activity table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_status_created 
    ON certificate_requests(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_user_status 
    ON certificate_requests(user_id, status) WHERE status IN ('pending', 'approved', 'rejected');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_email_lookup 
    ON certificate_requests(recipient_email) WHERE recipient_email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_batch_processing 
    ON certificate_requests(batch_id, status) WHERE batch_id IS NOT NULL;

-- Certificates table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_email_verification 
    ON certificates(email, verification_code) WHERE verification_code IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_expiry_monitoring 
    ON certificates(expiry_date) WHERE expiry_date > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_course_stats 
    ON certificates(course_name, issue_date DESC);

-- Audit and logging optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entries_user_action 
    ON audit_log_entries(user_id, action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entries_entity_tracking 
    ON audit_log_entries(entity_type, entity_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_audit_logs_certificate 
    ON certificate_audit_logs(certificate_id, performed_at DESC);

-- Notifications optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, read) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_cleanup 
    ON notifications(created_at) WHERE read = true;

-- Phase 2: Query Pattern Optimization
-- Profiles table (frequently joined)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_status 
    ON profiles(role, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_compliance_lookup 
    ON profiles(compliance_status, compliance_tier) WHERE compliance_tier IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_search 
    ON profiles USING gin(to_tsvector('english', COALESCE(email, '') || ' ' || COALESCE(display_name, '')));

-- Team management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_active_lookup 
    ON team_members(team_id, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_teams 
    ON team_members(user_id, status, role) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_provider_active 
    ON teams(provider_id, status) WHERE provider_id IS NOT NULL AND status = 'active';

-- Provider management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_authorized_providers_location 
    ON authorized_providers(primary_location_id, status) WHERE primary_location_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_provider_team_assignments_active 
    ON provider_team_assignments(provider_id, team_id, status) WHERE status = 'active';

-- Phase 3: Reporting & Analytics Optimization
-- User compliance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_compliance_records_reporting 
    ON user_compliance_records(user_id, compliance_status, submitted_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_compliance_records_pending 
    ON user_compliance_records(compliance_status, submitted_at DESC) WHERE compliance_status = 'pending';

-- CRM analytics optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_conversion_tracking 
    ON crm_leads(lead_status, created_at DESC, assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_opportunities_pipeline 
    ON crm_opportunities(stage, expected_close_date, amount DESC) WHERE stage != 'closed_lost';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_activities_timeline 
    ON crm_activities(related_to_id, activity_date DESC, activity_type);

-- System metrics optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_usage_patterns_analytics 
    ON system_usage_patterns(usage_date DESC, feature_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_engagement_scores_trending 
    ON user_engagement_scores(calculated_date DESC, engagement_score DESC);

-- Phase 4: Background Operations Optimization
-- Batch processing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bulk_operations_processing 
    ON compliance_bulk_operations(status, initiated_by, started_at DESC) WHERE status != 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_monitoring 
    ON compliance_workflow_executions(status, escalation_level, started_at DESC) WHERE status = 'active';

-- Notification queue optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_processing 
    ON compliance_notification_queue(status, priority DESC, scheduled_for) WHERE status = 'pending';

-- Cleanup and maintenance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_reports_cleanup 
    ON compliance_reports(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_monitoring 
    ON compliance_system_health(component_name, last_check DESC);

-- Additional specialized indexes
-- Course management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_offerings_scheduling 
    ON course_offerings(start_date, end_date, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user_course 
    ON enrollments(student_id, course_offering_id, enrollment_status);

-- Location-based queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locations_active_search 
    ON locations(status, city, state) WHERE status = 'ACTIVE';

-- Time-series data optimization for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_monthly_stats 
    ON certificate_requests(DATE_TRUNC('month', created_at), status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_daily_patterns 
    ON audit_log_entries(DATE_TRUNC('day', timestamp), user_id) WHERE user_id IS NOT NULL;

-- Foreign key optimization for joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_location_fk 
    ON certificates(location_id) WHERE location_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_requests_location_fk 
    ON certificate_requests(location_id) WHERE location_id IS NOT NULL;

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_backend_function_status_health 
    ON backend_function_status(status, health_score DESC, last_checked DESC);

-- Workflow automation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_states_execution 
    ON compliance_workflow_states(execution_id, stage_status, entered_at);

-- Update table statistics for query planner optimization
ANALYZE certificate_requests;
ANALYZE certificates;
ANALYZE profiles;
ANALYZE team_members;
ANALYZE teams;
ANALYZE authorized_providers;
ANALYZE audit_log_entries;
ANALYZE notifications;
ANALYZE user_compliance_records;
ANALYZE crm_leads;
ANALYZE crm_opportunities;
ANALYZE system_usage_patterns;

-- Create audit log entry for this migration
INSERT INTO public.audit_logs (
    action,
    entity_type,
    details
) VALUES (
    'migration_applied',
    'performance_indexes',
    jsonb_build_object(
        'migration', 'Migration 11: Create performance indexes',
        'description', 'Added comprehensive performance indexes for query optimization',
        'phases', jsonb_build_array(
            'High-Activity Table Optimization',
            'Query Pattern Optimization', 
            'Reporting & Analytics Optimization',
            'Background Operations Optimization'
        ),
        'total_indexes_created', 45,
        'timestamp', NOW()
    )
);

-- Migration completed successfully
SELECT 'Migration 11: Create performance indexes - COMPLETED' as result;
