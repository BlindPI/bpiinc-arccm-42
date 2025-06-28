
-- Migration 13: Insert complete set of 27 default notification templates
-- Uses correct notification_templates table structure with proper column names

-- Clear any existing templates first to avoid conflicts
DELETE FROM notification_templates WHERE template_name IN (
    'system_maintenance_scheduled', 'system_maintenance_completed', 'system_alert_critical',
    'account_created', 'password_reset_requested', 'login_security_alert',
    'certificate_request_submitted', 'certificate_approved', 'certificate_rejected', 
    'certificate_expiring_soon', 'batch_certificates_submitted',
    'course_enrollment_confirmed', 'course_reminder_24h', 'course_cancelled', 'course_rescheduled',
    'role_assignment_changed', 'supervision_assignment', 'permission_updated',
    'provider_application_submitted', 'provider_approved', 'instructor_certification_required',
    'compliance_requirement_assigned', 'compliance_submission_approved', 'workflow_approval_requested', 'document_review_required',
    'bulk_operation_completed', 'system_health_alert'
);

-- Insert all 27 comprehensive notification templates
INSERT INTO notification_templates (
    template_name,
    template_type,
    category,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    variables,
    is_active,
    priority,
    delivery_channels
) VALUES 

-- PHASE 1: System & Account Templates (6 templates)
(
    'system_maintenance_scheduled',
    'system_alert',
    'SYSTEM',
    'Scheduled System Maintenance - {{maintenance_date}}',
    'System maintenance has been scheduled for {{maintenance_date}} from {{start_time}} to {{end_time}}. The system will be unavailable during this time.',
    'Scheduled System Maintenance - {{maintenance_date}}',
    '<h2>Scheduled System Maintenance</h2><p>System maintenance has been scheduled for <strong>{{maintenance_date}}</strong> from <strong>{{start_time}}</strong> to <strong>{{end_time}}</strong>.</p><p>The system will be unavailable during this time. Please plan accordingly.</p><p>We apologize for any inconvenience.</p>',
    '{"maintenance_date": "string", "start_time": "string", "end_time": "string", "duration": "string", "reason": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'system_maintenance_completed',
    'system_alert',
    'SYSTEM',
    'System Maintenance Completed',
    'System maintenance has been completed successfully. All services are now available.',
    'System Maintenance Completed',
    '<h2>System Maintenance Completed</h2><p>System maintenance has been completed successfully. All services are now available.</p><p>Thank you for your patience during the maintenance window.</p>',
    '{"maintenance_duration": "string", "services_affected": "array"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),
(
    'system_alert_critical',
    'system_alert',
    'SYSTEM',
    'CRITICAL: System Alert - {{alert_type}}',
    'CRITICAL ALERT: {{alert_message}}. Immediate attention required.',
    'CRITICAL: System Alert - {{alert_type}}',
    '<h2 style="color: red;">CRITICAL SYSTEM ALERT</h2><p><strong>Alert Type:</strong> {{alert_type}}</p><p><strong>Message:</strong> {{alert_message}}</p><p><strong>Time:</strong> {{alert_time}}</p><p style="color: red; font-weight: bold;">Immediate attention required.</p>',
    '{"alert_type": "string", "alert_message": "string", "alert_time": "string", "affected_systems": "array"}',
    true,
    'URGENT',
    '["in_app", "email", "sms"]'
),
(
    'account_created',
    'account',
    'ACCOUNT',
    'Welcome to {{system_name}}',
    'Welcome {{user_name}}! Your account has been created successfully. Your username is {{username}} and your role is {{user_role}}.',
    'Welcome to {{system_name}}',
    '<h2>Welcome to {{system_name}}!</h2><p>Hello <strong>{{user_name}}</strong>,</p><p>Your account has been created successfully:</p><ul><li>Username: <strong>{{username}}</strong></li><li>Role: <strong>{{user_role}}</strong></li></ul><p>Please log in to get started.</p><p><a href="{{login_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>',
    '{"user_name": "string", "username": "string", "user_role": "string", "system_name": "string", "login_url": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'password_reset_requested',
    'security',
    'ACCOUNT',
    'Password Reset Request',
    'A password reset has been requested for your account. Click the link to reset your password: {{reset_link}}',
    'Password Reset Request',
    '<h2>Password Reset Request</h2><p>A password reset has been requested for your account.</p><p><a href="{{reset_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p><p>This link will expire in {{expiry_time}}.</p><p>If you did not request this reset, please ignore this email.</p>',
    '{"reset_link": "string", "expiry_time": "string", "user_name": "string"}',
    true,
    'HIGH',
    '["email"]'
),
(
    'login_security_alert',
    'security',
    'ACCOUNT',
    'New Login Detected',
    'A new login to your account was detected from {{location}} at {{login_time}}.',
    'New Login Detected',
    '<h2>New Login Detected</h2><p>A new login to your account was detected:</p><ul><li><strong>Location:</strong> {{location}}</li><li><strong>Time:</strong> {{login_time}}</li><li><strong>Device:</strong> {{device}}</li></ul><p>If this was not you, please secure your account immediately.</p>',
    '{"location": "string", "login_time": "string", "device": "string", "ip_address": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),

-- PHASE 2: Certificate Management Templates (5 templates)
(
    'certificate_request_submitted',
    'certificate',
    'CERTIFICATE',
    'Certificate Request Submitted - {{course_name}}',
    'Your certificate request for {{course_name}} has been submitted successfully. Request ID: {{request_id}}. You will be notified once it has been reviewed.',
    'Certificate Request Submitted - {{course_name}}',
    '<h2>Certificate Request Submitted</h2><p>Your certificate request for <strong>{{course_name}}</strong> has been submitted successfully.</p><p><strong>Request ID:</strong> {{request_id}}</p><p><strong>Recipient:</strong> {{recipient_name}}</p><p>You will be notified once it has been reviewed.</p>',
    '{"course_name": "string", "request_id": "string", "recipient_name": "string", "submission_date": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),
(
    'certificate_approved',
    'certificate',
    'CERTIFICATE',
    'Certificate Approved - {{course_name}}',
    'Great news! Your certificate for {{course_name}} has been approved and is ready for download.',
    'Certificate Approved - {{course_name}}',
    '<h2>Certificate Approved!</h2><p>Great news <strong>{{recipient_name}}</strong>!</p><p>Your certificate for <strong>{{course_name}}</strong> has been approved and is ready for download.</p><p><a href="{{download_link}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Certificate</a></p><p><strong>Certificate ID:</strong> {{certificate_id}}</p>',
    '{"course_name": "string", "recipient_name": "string", "download_link": "string", "approval_date": "string", "certificate_id": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'certificate_rejected',
    'certificate',
    'CERTIFICATE',
    'Certificate Request Requires Revision - {{course_name}}',
    'Your certificate request for {{course_name}} requires revision. Reason: {{rejection_reason}}. Please review and resubmit.',
    'Certificate Request Requires Revision - {{course_name}}',
    '<h2>Certificate Request Requires Revision</h2><p>Your certificate request for <strong>{{course_name}}</strong> requires revision.</p><p><strong>Reason:</strong> {{rejection_reason}}</p><p>Please review the feedback and resubmit your request.</p><p><strong>Request ID:</strong> {{request_id}}</p>',
    '{"course_name": "string", "rejection_reason": "string", "recipient_name": "string", "request_id": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'certificate_expiring_soon',
    'certificate',
    'CERTIFICATE',
    'Certificate Expiring Soon - {{course_name}}',
    'Your certificate for {{course_name}} will expire on {{expiry_date}}. Please renew to maintain your certification.',
    'Certificate Expiring Soon - {{course_name}}',
    '<h2>Certificate Expiring Soon</h2><p>Your certificate for <strong>{{course_name}}</strong> will expire on <strong>{{expiry_date}}</strong>.</p><p>You have <strong>{{days_until_expiry}}</strong> days remaining.</p><p>Please renew to maintain your certification.</p><p><a href="{{renewal_link}}" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Certificate</a></p>',
    '{"course_name": "string", "expiry_date": "string", "recipient_name": "string", "renewal_link": "string", "days_until_expiry": "number"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'batch_certificates_submitted',
    'certificate',
    'CERTIFICATE',
    'Batch Certificate Request Submitted - {{batch_size}} Certificates',
    'Your batch of {{batch_size}} certificate requests has been submitted for review. Batch ID: {{batch_id}}.',
    'Batch Certificate Request Submitted - {{batch_size}} Certificates',
    '<h2>Batch Certificate Request Submitted</h2><p>Your batch of <strong>{{batch_size}}</strong> certificate requests has been submitted for review.</p><p><strong>Batch ID:</strong> {{batch_id}}</p><p><strong>Course:</strong> {{course_name}}</p><p>You will be notified once the batch has been processed.</p>',
    '{"batch_size": "number", "batch_id": "string", "course_name": "string", "submitter_name": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),

-- PHASE 3: Course & Training Templates (4 templates)
(
    'course_enrollment_confirmed',
    'course',
    'COURSE',
    'Course Enrollment Confirmed - {{course_name}}',
    'Your enrollment in {{course_name}} has been confirmed. Course starts on {{start_date}} at {{location}}.',
    'Course Enrollment Confirmed - {{course_name}}',
    '<h2>Course Enrollment Confirmed</h2><p>Your enrollment in <strong>{{course_name}}</strong> has been confirmed.</p><p><strong>Start Date:</strong> {{start_date}}</p><p><strong>Location:</strong> {{location}}</p><p><strong>Instructor:</strong> {{instructor_name}}</p><p><strong>Duration:</strong> {{duration}}</p>',
    '{"course_name": "string", "start_date": "string", "location": "string", "instructor_name": "string", "duration": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'course_reminder_24h',
    'course',
    'COURSE',
    'Course Reminder - {{course_name}} Tomorrow',
    'Reminder: Your course {{course_name}} starts tomorrow at {{start_time}}. Location: {{location}}.',
    'Course Reminder - {{course_name}} Tomorrow',
    '<h2>Course Reminder</h2><p>This is a reminder that your course <strong>{{course_name}}</strong> starts tomorrow at <strong>{{start_time}}</strong>.</p><p><strong>Location:</strong> {{location}}</p><p><strong>Instructor:</strong> {{instructor_name}}</p><p>Please arrive 15 minutes early. See you there!</p>',
    '{"course_name": "string", "start_time": "string", "location": "string", "instructor_name": "string"}',
    true,
    'NORMAL',
    '["in_app", "email", "sms"]'
),
(
    'course_cancelled',
    'course',
    'COURSE',
    'Course Cancelled - {{course_name}}',
    'Unfortunately, the course {{course_name}} scheduled for {{original_date}} has been cancelled. Reason: {{cancellation_reason}}.',
    'Course Cancelled - {{course_name}}',
    '<h2>Course Cancelled</h2><p>Unfortunately, the course <strong>{{course_name}}</strong> scheduled for <strong>{{original_date}}</strong> has been cancelled.</p><p><strong>Reason:</strong> {{cancellation_reason}}</p><p>We apologize for any inconvenience. You will be contacted about rescheduling options.</p><p><strong>Contact:</strong> {{contact_info}}</p>',
    '{"course_name": "string", "original_date": "string", "cancellation_reason": "string", "contact_info": "string"}',
    true,
    'HIGH',
    '["in_app", "email", "sms"]'
),
(
    'course_rescheduled',
    'course',
    'COURSE',
    'Course Rescheduled - {{course_name}}',
    'Your course {{course_name}} has been rescheduled from {{old_date}} to {{new_date}}.',
    'Course Rescheduled - {{course_name}}',
    '<h2>Course Rescheduled</h2><p>Your course <strong>{{course_name}}</strong> has been rescheduled:</p><p><strong>Original Date:</strong> {{old_date}}</p><p><strong>New Date:</strong> {{new_date}}</p><p><strong>Location:</strong> {{location}}</p><p>Please update your calendar accordingly.</p>',
    '{"course_name": "string", "old_date": "string", "new_date": "string", "location": "string"}',
    true,
    'HIGH',
    '["in_app", "email", "sms"]'
),

-- PHASE 4: Role Management & Supervision Templates (3 templates)
(
    'role_assignment_changed',
    'role_management',
    'ROLE_MANAGEMENT',
    'Role Assignment Updated',
    'Your role has been updated from {{old_role}} to {{new_role}}. This change is effective immediately.',
    'Role Assignment Updated',
    '<h2>Role Assignment Updated</h2><p>Your role has been updated:</p><p><strong>Previous Role:</strong> {{old_role}}</p><p><strong>New Role:</strong> {{new_role}}</p><p><strong>Changed By:</strong> {{changed_by}}</p><p>This change is effective immediately. Your access permissions have been updated accordingly.</p>',
    '{"old_role": "string", "new_role": "string", "user_name": "string", "effective_date": "string", "changed_by": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'supervision_assignment',
    'supervision',
    'SUPERVISION',
    'New Supervision Assignment',
    'You have been assigned as supervisor for {{supervisee_name}}. Please review their profile and begin the supervision process.',
    'New Supervision Assignment',
    '<h2>New Supervision Assignment</h2><p>You have been assigned as supervisor for <strong>{{supervisee_name}}</strong>.</p><p>Please review their profile and begin the supervision process.</p><ul><li>Supervisee Role: {{supervisee_role}}</li><li>Assignment Date: {{assignment_date}}</li></ul>',
    '{"supervisee_name": "string", "supervisee_role": "string", "assignment_date": "string", "supervisor_name": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'permission_updated',
    'role_management',
    'ROLE_MANAGEMENT',
    'Permissions Updated',
    'Your account permissions have been updated. Please review the changes and contact support if you have questions.',
    'Permissions Updated',
    '<h2>Permissions Updated</h2><p>Your account permissions have been updated:</p><p><strong>Updated By:</strong> {{updated_by}}</p><p><strong>Update Date:</strong> {{update_date}}</p><p>Please review the changes and contact support if you have questions.</p>',
    '{"updated_by": "string", "update_date": "string", "permission_changes": "array"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),

-- PHASE 5: Provider & Instructor Templates (3 templates)
(
    'provider_application_submitted',
    'provider',
    'PROVIDER',
    'Provider Application Submitted',
    'Your provider application has been submitted successfully. Application ID: {{application_id}}. You will be contacted within 5-7 business days.',
    'Provider Application Submitted',
    '<h2>Provider Application Submitted</h2><p>Your provider application has been submitted successfully.</p><p><strong>Application ID:</strong> {{application_id}}</p><p><strong>Provider Name:</strong> {{provider_name}}</p><p><strong>Contact Email:</strong> {{contact_email}}</p><p>You will be contacted within 5-7 business days regarding the status of your application.</p>',
    '{"application_id": "string", "provider_name": "string", "submission_date": "string", "contact_email": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),
(
    'provider_approved',
    'provider',
    'PROVIDER',
    'Provider Application Approved',
    'Congratulations! Your provider application has been approved. You can now begin offering training services.',
    'Provider Application Approved',
    '<h2>Provider Application Approved</h2><p>Congratulations <strong>{{provider_name}}</strong>!</p><p>Your provider application has been approved. You can now begin offering training services.</p><p><strong>Provider ID:</strong> {{provider_id}}</p><p><strong>Approval Date:</strong> {{approval_date}}</p><p><strong>Approved By:</strong> {{approved_by}}</p>',
    '{"provider_name": "string", "provider_id": "string", "approval_date": "string", "approved_by": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'instructor_certification_required',
    'instructor',
    'INSTRUCTOR',
    'Instructor Certification Required',
    'Your instructor certification for {{course_type}} requires renewal. Please complete the required training by {{due_date}}.',
    'Instructor Certification Required',
    '<h2>Instructor Certification Required</h2><p>Your instructor certification for <strong>{{course_type}}</strong> requires renewal.</p><p><strong>Due Date:</strong> {{due_date}}</p><p><strong>Certification Level:</strong> {{certification_level}}</p><p>Please complete the required training to maintain your certification status.</p>',
    '{"course_type": "string", "due_date": "string", "instructor_name": "string", "certification_level": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),

-- PHASE 6: Compliance & Workflow Templates (4 templates)
(
    'compliance_requirement_assigned',
    'compliance',
    'COMPLIANCE',
    'New Compliance Requirement Assigned',
    'You have been assigned a new compliance requirement: {{requirement_name}}. Due date: {{due_date}}.',
    'New Compliance Requirement Assigned',
    '<h2>New Compliance Requirement Assigned</h2><p>You have been assigned a new compliance requirement:</p><p><strong>Requirement:</strong> {{requirement_name}}</p><p><strong>Due Date:</strong> {{due_date}}</p><p><strong>Priority:</strong> {{priority}}</p><p><strong>Assigned By:</strong> {{assigned_by}}</p><p>Please complete this requirement by the due date.</p>',
    '{"requirement_name": "string", "due_date": "string", "priority": "string", "user_name": "string", "assigned_by": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'compliance_submission_approved',
    'compliance',
    'COMPLIANCE',
    'Compliance Submission Approved',
    'Your compliance submission for {{requirement_name}} has been approved. Well done!',
    'Compliance Submission Approved',
    '<h2>Compliance Submission Approved</h2><p>Your compliance submission for <strong>{{requirement_name}}</strong> has been approved.</p><p>Well done! This requirement is now marked as complete.</p><p><strong>Approved By:</strong> {{approved_by}}</p><p><strong>Approval Date:</strong> {{approval_date}}</p>',
    '{"requirement_name": "string", "approved_by": "string", "approval_date": "string", "user_name": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),
(
    'workflow_approval_requested',
    'workflow',
    'WORKFLOW',
    'Approval Required - {{workflow_name}}',
    'Your approval is required for: {{workflow_name}}. Requested by: {{requester_name}}.',
    'Approval Required - {{workflow_name}}',
    '<h2>Approval Required</h2><p>Your approval is required for:</p><p><strong>Workflow:</strong> {{workflow_name}}</p><p><strong>Requested by:</strong> {{requester_name}}</p><p><strong>Request Date:</strong> {{request_date}}</p><p><strong>Priority:</strong> {{priority}}</p><p><a href="{{approval_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>',
    '{"workflow_name": "string", "requester_name": "string", "request_date": "string", "approval_link": "string", "priority": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
),
(
    'document_review_required',
    'document',
    'COMPLIANCE',
    'Document Review Required - {{document_name}}',
    'A document requires your review: {{document_name}}. Submitted by: {{submitter_name}}.',
    'Document Review Required - {{document_name}}',
    '<h2>Document Review Required</h2><p>A document requires your review:</p><p><strong>Document:</strong> {{document_name}}</p><p><strong>Document Type:</strong> {{document_type}}</p><p><strong>Submitted by:</strong> {{submitter_name}}</p><p><strong>Submission Date:</strong> {{submission_date}}</p><p>Please review and provide feedback.</p>',
    '{"document_name": "string", "submitter_name": "string", "submission_date": "string", "document_type": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),

-- PHASE 7: Admin & System Templates (2 templates)
(
    'bulk_operation_completed',
    'admin',
    'GENERAL',
    'Bulk Operation Completed - {{operation_type}}',
    'Your bulk operation ({{operation_type}}) has been completed. {{processed_count}} items processed successfully.',
    'Bulk Operation Completed - {{operation_type}}',
    '<h2>Bulk Operation Completed</h2><p>Your bulk operation has been completed successfully:</p><p><strong>Operation:</strong> {{operation_type}}</p><p><strong>Items Processed:</strong> {{processed_count}}</p><p><strong>Success Rate:</strong> {{success_rate}}%</p><p><strong>Completion Time:</strong> {{completion_time}}</p>',
    '{"operation_type": "string", "processed_count": "number", "success_rate": "number", "completion_time": "string"}',
    true,
    'NORMAL',
    '["in_app", "email"]'
),
(
    'system_health_alert',
    'system_alert',
    'SYSTEM',
    'System Health Alert - {{component_name}}',
    'System health alert for {{component_name}}: {{health_message}}',
    'System Health Alert - {{component_name}}',
    '<h2>System Health Alert</h2><p><strong>Component:</strong> {{component_name}}</p><p><strong>Status:</strong> {{health_status}}</p><p><strong>Message:</strong> {{health_message}}</p><p><strong>Alert Time:</strong> {{alert_time}}</p><p>Please investigate and take appropriate action.</p>',
    '{"component_name": "string", "health_status": "string", "health_message": "string", "alert_time": "string"}',
    true,
    'HIGH',
    '["in_app", "email"]'
);

-- Update table statistics for query optimization
ANALYZE notification_templates;

-- Create comprehensive audit log entry
INSERT INTO audit_logs (
    action,
    entity_type,
    details
) VALUES (
    'migration_applied',
    'notification_templates',
    jsonb_build_object(
        'migration', 'Migration 13: Complete notification templates',
        'description', 'Inserted complete set of 27 default notification templates',
        'phases', jsonb_build_array(
            'System & Account (6 templates)',
            'Certificate Management (5 templates)', 
            'Course & Training (4 templates)',
            'Role Management & Supervision (3 templates)',
            'Provider & Instructor (3 templates)',
            'Compliance & Workflow (4 templates)',
            'Admin & System (2 templates)'
        ),
        'total_templates', 27,
        'categories', jsonb_build_array(
            'SYSTEM', 'ACCOUNT', 'CERTIFICATE', 'COURSE', 
            'ROLE_MANAGEMENT', 'SUPERVISION', 'PROVIDER', 
            'INSTRUCTOR', 'COMPLIANCE', 'WORKFLOW', 'GENERAL'
        ),
        'priority_levels', jsonb_build_array('NORMAL', 'HIGH', 'URGENT'),
        'delivery_channels', jsonb_build_array('in_app', 'email', 'sms'),
        'timestamp', NOW()
    )
);

-- Final verification query
SELECT 
    COUNT(*) as total_templates,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_templates,
    COUNT(CASE WHEN priority = 'HIGH' THEN 1 END) as high_priority,
    COUNT(CASE WHEN priority = 'URGENT' THEN 1 END) as urgent_priority,
    COUNT(CASE WHEN category = 'CERTIFICATE' THEN 1 END) as certificate_templates,
    COUNT(CASE WHEN category = 'SYSTEM' THEN 1 END) as system_templates
FROM notification_templates;

-- Migration completed successfully
SELECT 'Migration 13: Complete notification templates with all 27 templates - COMPLETED SUCCESSFULLY' as result;
