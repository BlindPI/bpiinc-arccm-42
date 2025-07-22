| table_name                        | column_name                | data_type                | is_nullable | column_default                    |
| --------------------------------- | -------------------------- | ------------------------ | ----------- | --------------------------------- |
| compliance_actions                | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_actions                | user_id                    | uuid                     | NO          | null                              |
| compliance_actions                | metric_id                  | uuid                     | NO          | null                              |
| compliance_actions                | action_type                | character varying        | NO          | null                              |
| compliance_actions                | title                      | character varying        | NO          | null                              |
| compliance_actions                | description                | text                     | YES         | null                              |
| compliance_actions                | due_date                   | date                     | YES         | null                              |
| compliance_actions                | priority                   | character varying        | YES         | 'medium'::character varying       |
| compliance_actions                | status                     | character varying        | YES         | 'open'::character varying         |
| compliance_actions                | assigned_by                | uuid                     | YES         | null                              |
| compliance_actions                | completed_by               | uuid                     | YES         | null                              |
| compliance_actions                | completed_at               | timestamp with time zone | YES         | null                              |
| compliance_actions                | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_actions                | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_activity_log           | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_activity_log           | user_id                    | uuid                     | YES         | null                              |
| compliance_activity_log           | action                     | character varying        | NO          | null                              |
| compliance_activity_log           | requirement_id             | uuid                     | YES         | null                              |
| compliance_activity_log           | metadata                   | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_activity_log           | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_advanced_reports       | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_advanced_reports       | report_name                | character varying        | NO          | null                              |
| compliance_advanced_reports       | report_type                | character varying        | NO          | null                              |
| compliance_advanced_reports       | report_category            | character varying        | NO          | null                              |
| compliance_advanced_reports       | data_sources               | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_advanced_reports       | filters_config             | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_advanced_reports       | aggregation_rules          | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_advanced_reports       | visualization_config       | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_advanced_reports       | schedule_config            | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_advanced_reports       | recipients                 | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_advanced_reports       | last_generated             | timestamp with time zone | YES         | null                              |
| compliance_advanced_reports       | next_generation            | timestamp with time zone | YES         | null                              |
| compliance_advanced_reports       | generation_status          | character varying        | YES         | 'scheduled'::character varying    |
| compliance_advanced_reports       | report_template            | text                     | YES         | null                              |
| compliance_advanced_reports       | output_formats             | jsonb                    | YES         | '["pdf", "excel", "json"]'::jsonb |
| compliance_advanced_reports       | retention_days             | integer                  | YES         | 90                                |
| compliance_advanced_reports       | is_active                  | boolean                  | YES         | true                              |
| compliance_advanced_reports       | created_by                 | uuid                     | YES         | null                              |
| compliance_advanced_reports       | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_advanced_reports       | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_assessments            | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_assessments            | assessment_name            | character varying        | NO          | null                              |
| compliance_assessments            | framework_id               | uuid                     | YES         | null                              |
| compliance_assessments            | assessment_type            | character varying        | YES         | 'internal'::character varying     |
| compliance_assessments            | assessment_status          | character varying        | YES         | 'planned'::character varying      |
| compliance_assessments            | start_date                 | date                     | YES         | null                              |
| compliance_assessments            | end_date                   | date                     | YES         | null                              |
| compliance_assessments            | assessor_id                | uuid                     | YES         | null                              |
| compliance_assessments            | scope_description          | text                     | YES         | null                              |
| compliance_assessments            | findings                   | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_assessments            | recommendations            | text                     | YES         | null                              |
| compliance_assessments            | overall_score              | integer                  | YES         | null                              |
| compliance_assessments            | compliance_percentage      | numeric                  | YES         | null                              |
| compliance_assessments            | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_assessments            | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_assessments            | created_by                 | uuid                     | YES         | null                              |
| compliance_audit_events           | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_audit_events           | event_type                 | character varying        | NO          | null                              |
| compliance_audit_events           | user_id                    | uuid                     | YES         | null                              |
| compliance_audit_events           | user_name                  | text                     | YES         | null                              |
| compliance_audit_events           | target_user_id             | uuid                     | YES         | null                              |
| compliance_audit_events           | target_user_name           | text                     | YES         | null                              |
| compliance_audit_events           | description                | text                     | NO          | null                              |
| compliance_audit_events           | metadata                   | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_audit_events           | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_audit_events           | performed_by               | uuid                     | YES         | null                              |
| compliance_audit_log              | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_audit_log              | user_id                    | uuid                     | NO          | null                              |
| compliance_audit_log              | metric_id                  | uuid                     | YES         | null                              |
| compliance_audit_log              | audit_type                 | character varying        | NO          | null                              |
| compliance_audit_log              | old_value                  | jsonb                    | YES         | null                              |
| compliance_audit_log              | new_value                  | jsonb                    | YES         | null                              |
| compliance_audit_log              | performed_by               | uuid                     | YES         | null                              |
| compliance_audit_log              | notes                      | text                     | YES         | null                              |
| compliance_audit_log              | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_audit_trail            | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_audit_trail            | user_id                    | uuid                     | YES         | null                              |
| compliance_audit_trail            | action_type                | character varying        | NO          | null                              |
| compliance_audit_trail            | resource_type              | character varying        | NO          | null                              |
| compliance_audit_trail            | resource_id                | uuid                     | YES         | null                              |
| compliance_audit_trail            | details                    | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_audit_trail            | ip_address                 | inet                     | YES         | null                              |
| compliance_audit_trail            | user_agent                 | text                     | YES         | null                              |
| compliance_audit_trail            | session_id                 | character varying        | YES         | null                              |
| compliance_audit_trail            | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_benchmarks             | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_benchmarks             | benchmark_name             | character varying        | NO          | null                              |
| compliance_benchmarks             | benchmark_type             | character varying        | NO          | null                              |
| compliance_benchmarks             | industry_standard          | numeric                  | YES         | null                              |
| compliance_benchmarks             | organization_average       | numeric                  | YES         | null                              |
| compliance_benchmarks             | top_quartile               | numeric                  | YES         | null                              |
| compliance_benchmarks             | bottom_quartile            | numeric                  | YES         | null                              |
| compliance_benchmarks             | best_practice_threshold    | numeric                  | YES         | null                              |
| compliance_benchmarks             | metric_unit                | character varying        | YES         | null                              |
| compliance_benchmarks             | benchmark_category         | character varying        | YES         | null                              |
| compliance_benchmarks             | effective_date             | date                     | NO          | null                              |
| compliance_benchmarks             | expiry_date                | date                     | YES         | null                              |
| compliance_benchmarks             | data_sources               | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_benchmarks             | calculation_method         | text                     | YES         | null                              |
| compliance_benchmarks             | is_active                  | boolean                  | YES         | true                              |
| compliance_benchmarks             | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_benchmarks             | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_bulk_operations        | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_bulk_operations        | operation_type             | character varying        | NO          | null                              |
| compliance_bulk_operations        | initiated_by               | uuid                     | YES         | null                              |
| compliance_bulk_operations        | target_users               | ARRAY                    | NO          | null                              |
| compliance_bulk_operations        | operation_params           | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_bulk_operations        | status                     | character varying        | YES         | 'pending'::character varying      |
| compliance_bulk_operations        | progress_count             | integer                  | YES         | 0                                 |
| compliance_bulk_operations        | total_count                | integer                  | NO          | null                              |
| compliance_bulk_operations        | results                    | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_bulk_operations        | started_at                 | timestamp with time zone | YES         | now()                             |
| compliance_bulk_operations        | completed_at               | timestamp with time zone | YES         | null                              |
| compliance_bulk_operations        | error_log                  | ARRAY                    | YES         | null                              |
| compliance_dashboard_configs      | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_dashboard_configs      | user_id                    | uuid                     | YES         | null                              |
| compliance_dashboard_configs      | dashboard_name             | character varying        | NO          | null                              |
| compliance_dashboard_configs      | widget_config              | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_dashboard_configs      | layout_config              | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_dashboard_configs      | refresh_interval           | integer                  | YES         | 300                               |
| compliance_dashboard_configs      | is_default                 | boolean                  | YES         | false                             |
| compliance_dashboard_configs      | is_shared                  | boolean                  | YES         | false                             |
| compliance_dashboard_configs      | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_dashboard_configs      | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_dashboard_summary      | user_id                    | uuid                     | YES         | null                              |
| compliance_dashboard_summary      | display_name               | text                     | YES         | null                              |
| compliance_dashboard_summary      | email                      | text                     | YES         | null                              |
| compliance_dashboard_summary      | role                       | text                     | YES         | null                              |
| compliance_dashboard_summary      | compliance_tier            | character varying        | YES         | null                              |
| compliance_dashboard_summary      | compliance_score           | numeric                  | YES         | null                              |
| compliance_dashboard_summary      | total_requirements         | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | compliant_count            | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | warning_count              | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | non_compliant_count        | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | pending_count              | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | overdue_count              | bigint                   | YES         | null                              |
| compliance_dashboard_summary      | last_activity              | timestamp with time zone | YES         | null                              |
| compliance_document_requirements  | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_document_requirements  | metric_id                  | uuid                     | NO          | null                              |
| compliance_document_requirements  | document_type              | character varying        | NO          | null                              |
| compliance_document_requirements  | required_file_types        | ARRAY                    | YES         | '{}'::text[]                      |
| compliance_document_requirements  | max_file_size_mb           | integer                  | YES         | 10                                |
| compliance_document_requirements  | requires_expiry_date       | boolean                  | YES         | false                             |
| compliance_document_requirements  | auto_expire_days           | integer                  | YES         | null                              |
| compliance_document_requirements  | description                | text                     | YES         | null                              |
| compliance_document_requirements  | example_files              | ARRAY                    | YES         | null                              |
| compliance_document_requirements  | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_document_requirements  | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_document_reviews       | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_document_reviews       | document_id                | uuid                     | NO          | null                              |
| compliance_document_reviews       | user_id                    | uuid                     | YES         | null                              |
| compliance_document_reviews       | reviewer_id                | uuid                     | YES         | null                              |
| compliance_document_reviews       | review_status              | character varying        | YES         | 'pending'::character varying      |
| compliance_document_reviews       | review_notes               | text                     | YES         | null                              |
| compliance_document_reviews       | reviewed_at                | timestamp with time zone | YES         | null                              |
| compliance_document_reviews       | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_documents              | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_documents              | user_id                    | uuid                     | NO          | null                              |
| compliance_documents              | metric_id                  | uuid                     | NO          | null                              |
| compliance_documents              | file_name                  | character varying        | NO          | null                              |
| compliance_documents              | file_path                  | character varying        | NO          | null                              |
| compliance_documents              | file_type                  | character varying        | NO          | null                              |
| compliance_documents              | file_size                  | bigint                   | NO          | null                              |
| compliance_documents              | upload_date                | timestamp with time zone | YES         | now()                             |
| compliance_documents              | expiry_date                | date                     | YES         | null                              |
| compliance_documents              | verification_status        | character varying        | YES         | 'pending'::character varying      |
| compliance_documents              | verified_by                | uuid                     | YES         | null                              |
| compliance_documents              | verified_at                | timestamp with time zone | YES         | null                              |
| compliance_documents              | verification_notes         | text                     | YES         | null                              |
| compliance_documents              | rejection_reason           | text                     | YES         | null                              |
| compliance_documents              | is_current                 | boolean                  | YES         | true                              |
| compliance_documents              | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_documents              | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_escalation_rules       | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_escalation_rules       | workflow_id                | uuid                     | YES         | null                              |
| compliance_escalation_rules       | escalation_level           | integer                  | NO          | null                              |
| compliance_escalation_rules       | trigger_condition          | character varying        | NO          | null                              |
| compliance_escalation_rules       | delay_hours                | integer                  | NO          | null                              |
| compliance_escalation_rules       | action_type                | character varying        | NO          | null                              |
| compliance_escalation_rules       | action_config              | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_escalation_rules       | notification_template_id   | uuid                     | YES         | null                              |
| compliance_escalation_rules       | is_active                  | boolean                  | YES         | true                              |
| compliance_frameworks             | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_frameworks             | framework_name             | character varying        | NO          | null                              |
| compliance_frameworks             | framework_description      | text                     | YES         | null                              |
| compliance_frameworks             | framework_version          | character varying        | YES         | null                              |
| compliance_frameworks             | is_active                  | boolean                  | YES         | true                              |
| compliance_frameworks             | requirements               | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_frameworks             | assessment_criteria        | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_frameworks             | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_frameworks             | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_intelligence_insights  | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_intelligence_insights  | insight_type               | character varying        | NO          | null                              |
| compliance_intelligence_insights  | insight_category           | character varying        | NO          | null                              |
| compliance_intelligence_insights  | entity_type                | character varying        | NO          | null                              |
| compliance_intelligence_insights  | entity_id                  | uuid                     | YES         | null                              |
| compliance_intelligence_insights  | insight_title              | character varying        | NO          | null                              |
| compliance_intelligence_insights  | insight_description        | text                     | NO          | null                              |
| compliance_intelligence_insights  | insight_severity           | character varying        | NO          | null                              |
| compliance_intelligence_insights  | confidence_score           | numeric                  | YES         | 0                                 |
| compliance_intelligence_insights  | actionable_recommendations | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_intelligence_insights  | supporting_data            | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_intelligence_insights  | insight_date               | date                     | NO          | null                              |
| compliance_intelligence_insights  | expiry_date                | date                     | YES         | null                              |
| compliance_intelligence_insights  | is_acknowledged            | boolean                  | YES         | false                             |
| compliance_intelligence_insights  | acknowledged_by            | uuid                     | YES         | null                              |
| compliance_intelligence_insights  | acknowledged_at            | timestamp with time zone | YES         | null                              |
| compliance_intelligence_insights  | resolution_status          | character varying        | YES         | 'open'::character varying         |
| compliance_intelligence_insights  | resolution_notes           | text                     | YES         | null                              |
| compliance_intelligence_insights  | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_intelligence_insights  | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_issues                 | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_issues                 | user_id                    | uuid                     | NO          | null                              |
| compliance_issues                 | issue_type                 | text                     | NO          | null                              |
| compliance_issues                 | description                | text                     | NO          | null                              |
| compliance_issues                 | severity                   | text                     | NO          | 'MEDIUM'::text                    |
| compliance_issues                 | status                     | text                     | NO          | 'OPEN'::text                      |
| compliance_issues                 | due_date                   | date                     | YES         | null                              |
| compliance_issues                 | resolved_at                | timestamp with time zone | YES         | null                              |
| compliance_issues                 | resolved_by                | uuid                     | YES         | null                              |
| compliance_issues                 | created_at                 | timestamp with time zone | NO          | now()                             |
| compliance_issues                 | updated_at                 | timestamp with time zone | NO          | now()                             |
| compliance_metrics                | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_metrics                | name                       | character varying        | NO          | null                              |
| compliance_metrics                | description                | text                     | YES         | null                              |
| compliance_metrics                | category                   | character varying        | NO          | null                              |
| compliance_metrics                | required_for_roles         | ARRAY                    | YES         | '{}'::text[]                      |
| compliance_metrics                | measurement_type           | character varying        | NO          | 'boolean'::character varying      |
| compliance_metrics                | target_value               | jsonb                    | YES         | null                              |
| compliance_metrics                | weight                     | integer                  | YES         | 1                                 |
| compliance_metrics                | is_active                  | boolean                  | YES         | true                              |
| compliance_metrics                | created_by                 | uuid                     | YES         | null                              |
| compliance_metrics                | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_metrics                | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_metrics                | applicable_tiers           | character varying        | YES         | 'basic,robust'::character varying |
| compliance_metrics                | required_for_basic         | boolean                  | YES         | false                             |
| compliance_metrics                | required_for_robust        | boolean                  | YES         | false                             |
| compliance_notification_queue     | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_notification_queue     | notification_type          | character varying        | NO          | null                              |
| compliance_notification_queue     | recipient_user_id          | uuid                     | YES         | null                              |
| compliance_notification_queue     | sender_user_id             | uuid                     | YES         | null                              |
| compliance_notification_queue     | subject                    | character varying        | NO          | null                              |
| compliance_notification_queue     | content                    | text                     | NO          | null                              |
| compliance_notification_queue     | metadata                   | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_notification_queue     | priority                   | integer                  | YES         | 3                                 |
| compliance_notification_queue     | status                     | character varying        | YES         | 'pending'::character varying      |
| compliance_notification_queue     | scheduled_for              | timestamp with time zone | YES         | now()                             |
| compliance_notification_queue     | sent_at                    | timestamp with time zone | YES         | null                              |
| compliance_notification_queue     | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_real_time_monitoring   | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_real_time_monitoring   | monitor_name               | character varying        | NO          | null                              |
| compliance_real_time_monitoring   | monitor_type               | character varying        | NO          | null                              |
| compliance_real_time_monitoring   | entity_type                | character varying        | NO          | null                              |
| compliance_real_time_monitoring   | entity_id                  | uuid                     | YES         | null                              |
| compliance_real_time_monitoring   | metric_being_monitored     | character varying        | NO          | null                              |
| compliance_real_time_monitoring   | current_value              | numeric                  | NO          | null                              |
| compliance_real_time_monitoring   | threshold_warning          | numeric                  | YES         | null                              |
| compliance_real_time_monitoring   | threshold_critical         | numeric                  | YES         | null                              |
| compliance_real_time_monitoring   | alert_status               | character varying        | YES         | 'normal'::character varying       |
| compliance_real_time_monitoring   | last_alert_sent            | timestamp with time zone | YES         | null                              |
| compliance_real_time_monitoring   | alert_frequency_minutes    | integer                  | YES         | 60                                |
| compliance_real_time_monitoring   | consecutive_violations     | integer                  | YES         | 0                                 |
| compliance_real_time_monitoring   | monitoring_config          | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_real_time_monitoring   | is_active                  | boolean                  | YES         | true                              |
| compliance_real_time_monitoring   | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_real_time_monitoring   | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_records                | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_records                | user_id                    | uuid                     | YES         | null                              |
| compliance_records                | record_type                | character varying        | NO          | null                              |
| compliance_records                | record_title               | character varying        | NO          | null                              |
| compliance_records                | record_description         | text                     | YES         | null                              |
| compliance_records                | compliance_status          | character varying        | YES         | 'pending'::character varying      |
| compliance_records                | priority_level             | character varying        | YES         | 'normal'::character varying       |
| compliance_records                | due_date                   | timestamp with time zone | YES         | null                              |
| compliance_records                | completion_date            | timestamp with time zone | YES         | null                              |
| compliance_records                | assigned_to                | uuid                     | YES         | null                              |
| compliance_records                | reviewer_id                | uuid                     | YES         | null                              |
| compliance_records                | compliance_data            | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_records                | attachments                | ARRAY                    | YES         | '{}'::uuid[]                      |
| compliance_records                | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_records                | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_report_templates       | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_report_templates       | name                       | character varying        | NO          | null                              |
| compliance_report_templates       | description                | text                     | YES         | null                              |
| compliance_report_templates       | template_type              | character varying        | NO          | null                              |
| compliance_report_templates       | parameters                 | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_report_templates       | query_config               | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_report_templates       | output_format              | character varying        | YES         | 'json'::character varying         |
| compliance_report_templates       | is_active                  | boolean                  | YES         | true                              |
| compliance_report_templates       | created_by                 | uuid                     | YES         | null                              |
| compliance_report_templates       | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_report_templates       | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_reports                | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_reports                | template_id                | uuid                     | YES         | null                              |
| compliance_reports                | generated_by               | uuid                     | YES         | null                              |
| compliance_reports                | report_name                | character varying        | NO          | null                              |
| compliance_reports                | parameters_used            | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_reports                | report_data                | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_reports                | generation_status          | character varying        | YES         | 'pending'::character varying      |
| compliance_reports                | file_path                  | text                     | YES         | null                              |
| compliance_reports                | expires_at                 | timestamp with time zone | YES         | null                              |
| compliance_reports                | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_reports                | completed_at               | timestamp with time zone | YES         | null                              |
| compliance_requirements           | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_requirements           | name                       | character varying        | NO          | null                              |
| compliance_requirements           | description                | text                     | YES         | null                              |
| compliance_requirements           | requirement_type           | character varying        | NO          | null                              |
| compliance_requirements           | category                   | character varying        | YES         | 'general'::character varying      |
| compliance_requirements           | tier_level                 | character varying        | YES         | 'basic'::character varying        |
| compliance_requirements           | is_mandatory               | boolean                  | YES         | true                              |
| compliance_requirements           | due_days_from_assignment   | integer                  | YES         | 30                                |
| compliance_requirements           | points_value               | integer                  | YES         | 10                                |
| compliance_requirements           | document_required          | boolean                  | YES         | false                             |
| compliance_requirements           | external_link_required     | boolean                  | YES         | false                             |
| compliance_requirements           | form_template              | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | validation_rules           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | renewal_frequency_months   | integer                  | YES         | null                              |
| compliance_requirements           | auto_assign_rules          | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | completion_criteria        | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | notification_settings      | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | display_order              | integer                  | YES         | 0                                 |
| compliance_requirements           | icon                       | character varying        | YES         | null                              |
| compliance_requirements           | color_code                 | character varying        | YES         | '#3B82F6'::character varying      |
| compliance_requirements           | estimated_completion_time  | integer                  | YES         | 60                                |
| compliance_requirements           | difficulty_level           | character varying        | YES         | 'medium'::character varying       |
| compliance_requirements           | prerequisites              | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_requirements           | related_requirements       | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_requirements           | compliance_weight          | numeric                  | YES         | 1.00                              |
| compliance_requirements           | audit_frequency_days       | integer                  | YES         | 90                                |
| compliance_requirements           | escalation_rules           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_requirements           | approval_required          | boolean                  | YES         | false                             |
| compliance_requirements           | supervisor_review_required | boolean                  | YES         | false                             |
| compliance_requirements           | is_active                  | boolean                  | YES         | true                              |
| compliance_requirements           | created_by                 | uuid                     | YES         | null                              |
| compliance_requirements           | updated_by                 | uuid                     | YES         | null                              |
| compliance_requirements           | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_requirements           | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_requirements           | deactivated_at             | timestamp with time zone | YES         | null                              |
| compliance_requirements           | deactivated_by             | uuid                     | YES         | null                              |
| compliance_requirements           | version                    | integer                  | YES         | 1                                 |
| compliance_requirements           | change_log                 | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_requirements_templates | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_requirements_templates | template_id                | uuid                     | YES         | null                              |
| compliance_requirements_templates | requirement_id             | uuid                     | YES         | null                              |
| compliance_requirements_templates | is_mandatory               | boolean                  | YES         | true                              |
| compliance_requirements_templates | custom_due_days            | integer                  | YES         | null                              |
| compliance_requirements_templates | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_risk_assessments       | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_risk_assessments       | assessment_name            | character varying        | NO          | null                              |
| compliance_risk_assessments       | risk_category              | character varying        | NO          | null                              |
| compliance_risk_assessments       | entity_type                | character varying        | NO          | null                              |
| compliance_risk_assessments       | entity_id                  | uuid                     | YES         | null                              |
| compliance_risk_assessments       | risk_probability           | numeric                  | NO          | null                              |
| compliance_risk_assessments       | risk_impact                | numeric                  | NO          | null                              |
| compliance_risk_assessments       | risk_score                 | numeric                  | YES         | null                              |
| compliance_risk_assessments       | risk_level                 | character varying        | YES         | null                              |
| compliance_risk_assessments       | mitigation_strategies      | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_risk_assessments       | current_controls           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_risk_assessments       | residual_risk_score        | numeric                  | YES         | null                              |
| compliance_risk_assessments       | assessment_date            | date                     | NO          | null                              |
| compliance_risk_assessments       | next_review_date           | date                     | YES         | null                              |
| compliance_risk_assessments       | assessor_id                | uuid                     | YES         | null                              |
| compliance_risk_assessments       | assessment_notes           | text                     | YES         | null                              |
| compliance_risk_assessments       | remediation_plan           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_risk_assessments       | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_risk_assessments       | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_risk_scores            | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_risk_scores            | entity_type                | character varying        | NO          | null                              |
| compliance_risk_scores            | entity_id                  | uuid                     | NO          | null                              |
| compliance_risk_scores            | risk_score                 | integer                  | NO          | null                              |
| compliance_risk_scores            | risk_level                 | character varying        | NO          | null                              |
| compliance_risk_scores            | risk_factors               | jsonb                    | NO          | null                              |
| compliance_risk_scores            | mitigation_recommendations | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_risk_scores            | last_assessment            | timestamp with time zone | YES         | now()                             |
| compliance_risk_scores            | next_assessment_due        | date                     | YES         | null                              |
| compliance_risk_scores            | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_risk_scores            | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_rules                  | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_rules                  | rule_name                  | character varying        | NO          | null                              |
| compliance_rules                  | rule_category              | character varying        | NO          | null                              |
| compliance_rules                  | rule_description           | text                     | YES         | null                              |
| compliance_rules                  | rule_logic                 | jsonb                    | NO          | null                              |
| compliance_rules                  | severity                   | character varying        | YES         | 'medium'::character varying       |
| compliance_rules                  | entity_types               | ARRAY                    | NO          | null                              |
| compliance_rules                  | is_active                  | boolean                  | YES         | true                              |
| compliance_rules                  | auto_remediation           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_rules                  | notification_config        | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_rules                  | created_by                 | uuid                     | YES         | null                              |
| compliance_rules                  | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_rules                  | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_system_health          | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_system_health          | component_name             | character varying        | NO          | null                              |
| compliance_system_health          | health_status              | character varying        | NO          | null                              |
| compliance_system_health          | metrics                    | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_system_health          | last_check                 | timestamp with time zone | YES         | now()                             |
| compliance_system_health          | error_details              | text                     | YES         | null                              |
| compliance_system_health          | recovery_actions           | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_system_health          | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_templates              | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_templates              | role                       | character varying        | NO          | null                              |
| compliance_templates              | tier                       | character varying        | NO          | null                              |
| compliance_templates              | template_name              | character varying        | NO          | null                              |
| compliance_templates              | description                | text                     | YES         | null                              |
| compliance_templates              | ui_config                  | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_templates              | icon_name                  | character varying        | YES         | 'Award'::character varying        |
| compliance_templates              | color_scheme               | character varying        | YES         | '#3B82F6'::character varying      |
| compliance_templates              | is_active                  | boolean                  | YES         | true                              |
| compliance_templates              | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_templates              | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_tier_history           | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_tier_history           | user_id                    | uuid                     | YES         | null                              |
| compliance_tier_history           | old_tier                   | character varying        | YES         | null                              |
| compliance_tier_history           | new_tier                   | character varying        | NO          | null                              |
| compliance_tier_history           | changed_by                 | uuid                     | YES         | null                              |
| compliance_tier_history           | change_reason              | text                     | YES         | null                              |
| compliance_tier_history           | requirements_affected      | integer                  | YES         | 0                                 |
| compliance_tier_history           | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_tiers                  | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_tiers                  | user_id                    | uuid                     | NO          | null                              |
| compliance_tiers                  | tier                       | character varying        | NO          | 'basic'::character varying        |
| compliance_tiers                  | assigned_at                | timestamp with time zone | YES         | now()                             |
| compliance_tiers                  | completed_requirements     | integer                  | YES         | 0                                 |
| compliance_tiers                  | total_requirements         | integer                  | YES         | 0                                 |
| compliance_tiers                  | completion_percentage      | integer                  | YES         | 0                                 |
| compliance_tiers                  | last_updated               | timestamp with time zone | YES         | now()                             |
| compliance_trend_analysis         | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_trend_analysis         | analysis_type              | character varying        | NO          | null                              |
| compliance_trend_analysis         | entity_type                | character varying        | NO          | null                              |
| compliance_trend_analysis         | entity_id                  | uuid                     | YES         | null                              |
| compliance_trend_analysis         | metric_name                | character varying        | NO          | null                              |
| compliance_trend_analysis         | current_value              | numeric                  | NO          | null                              |
| compliance_trend_analysis         | previous_period_value      | numeric                  | YES         | null                              |
| compliance_trend_analysis         | trend_direction            | character varying        | NO          | null                              |
| compliance_trend_analysis         | trend_strength             | numeric                  | YES         | 0                                 |
| compliance_trend_analysis         | variance_percentage        | numeric                  | YES         | 0                                 |
| compliance_trend_analysis         | prediction_confidence      | numeric                  | YES         | 0                                 |
| compliance_trend_analysis         | next_period_prediction     | numeric                  | YES         | null                              |
| compliance_trend_analysis         | analysis_period            | character varying        | NO          | null                              |
| compliance_trend_analysis         | analysis_date              | date                     | NO          | null                              |
| compliance_trend_analysis         | trend_data                 | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_trend_analysis         | insights                   | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_trend_analysis         | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_violations             | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_violations             | rule_id                    | uuid                     | YES         | null                              |
| compliance_violations             | entity_type                | character varying        | NO          | null                              |
| compliance_violations             | entity_id                  | uuid                     | NO          | null                              |
| compliance_violations             | violation_type             | character varying        | NO          | null                              |
| compliance_violations             | violation_description      | text                     | YES         | null                              |
| compliance_violations             | severity                   | character varying        | NO          | null                              |
| compliance_violations             | detected_at                | timestamp with time zone | YES         | now()                             |
| compliance_violations             | status                     | character varying        | YES         | 'open'::character varying         |
| compliance_violations             | assigned_to                | uuid                     | YES         | null                              |
| compliance_violations             | resolution_notes           | text                     | YES         | null                              |
| compliance_violations             | resolved_at                | timestamp with time zone | YES         | null                              |
| compliance_violations             | resolved_by                | uuid                     | YES         | null                              |
| compliance_violations             | remediation_actions        | jsonb                    | YES         | '[]'::jsonb                       |
| compliance_violations             | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_violations             | updated_at                 | timestamp with time zone | YES         | now()                             |
| compliance_workflow_executions    | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_workflow_executions    | workflow_id                | uuid                     | YES         | null                              |
| compliance_workflow_executions    | triggered_by_user_id       | uuid                     | YES         | null                              |
| compliance_workflow_executions    | trigger_event              | character varying        | NO          | null                              |
| compliance_workflow_executions    | current_stage              | integer                  | YES         | 1                                 |
| compliance_workflow_executions    | status                     | character varying        | YES         | 'active'::character varying       |
| compliance_workflow_executions    | context_data               | jsonb                    | YES         | '{}'::jsonb                       |
| compliance_workflow_executions    | started_at                 | timestamp with time zone | YES         | now()                             |
| compliance_workflow_executions    | completed_at               | timestamp with time zone | YES         | null                              |
| compliance_workflow_executions    | escalated_at               | timestamp with time zone | YES         | null                              |
| compliance_workflow_executions    | escalation_level           | integer                  | YES         | 0                                 |
| compliance_workflows              | id                         | uuid                     | NO          | gen_random_uuid()                 |
| compliance_workflows              | name                       | character varying        | NO          | null                              |
| compliance_workflows              | description                | text                     | YES         | null                              |
| compliance_workflows              | trigger_conditions         | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_workflows              | escalation_rules           | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_workflows              | automation_config          | jsonb                    | NO          | '{}'::jsonb                       |
| compliance_workflows              | is_active                  | boolean                  | YES         | true                              |
| compliance_workflows              | created_by                 | uuid                     | YES         | null                              |
| compliance_workflows              | created_at                 | timestamp with time zone | YES         | now()                             |
| compliance_workflows              | updated_at                 | timestamp with time zone | YES         | now()                             |
| enterprise_compliance_metrics     | id                         | uuid                     | NO          | gen_random_uuid()                 |
| enterprise_compliance_metrics     | location_id                | uuid                     | YES         | null                              |
| enterprise_compliance_metrics     | provider_id                | bigint                   | YES         | null                              |
| enterprise_compliance_metrics     | team_id                    | uuid                     | YES         | null                              |
| enterprise_compliance_metrics     | metric_type                | character varying        | NO          | null                              |
| enterprise_compliance_metrics     | metric_value               | numeric                  | NO          | null                              |
| enterprise_compliance_metrics     | threshold_value            | numeric                  | YES         | null                              |
| enterprise_compliance_metrics     | compliance_status          | character varying        | YES         | 'compliant'::character varying    |
| enterprise_compliance_metrics     | measurement_date           | date                     | NO          | CURRENT_DATE                      |
| enterprise_compliance_metrics     | created_at                 | timestamp with time zone | YES         | now()                             |
| instructor_compliance_checks      | id                         | uuid                     | NO          | gen_random_uuid()                 |
| instructor_compliance_checks      | instructor_id              | uuid                     | YES         | null                              |
| instructor_compliance_checks      | check_type                 | character varying        | NO          | null                              |
| instructor_compliance_checks      | check_date                 | timestamp with time zone | YES         | now()                             |
| instructor_compliance_checks      | status                     | character varying        | YES         | 'pending'::character varying      |
| instructor_compliance_checks      | score                      | integer                  | YES         | null                              |
| instructor_compliance_checks      | notes                      | text                     | YES         | null                              |
| instructor_compliance_checks      | checked_by                 | uuid                     | YES         | null                              |
| instructor_compliance_checks      | due_date                   | timestamp with time zone | YES         | null                              |
| instructor_compliance_checks      | resolved_at                | timestamp with time zone | YES         | null                              |
| instructor_compliance_checks      | created_at                 | timestamp with time zone | YES         | now()                             |
| instructor_compliance_checks      | updated_at                 | timestamp with time zone | YES         | now()                             |
| member_compliance_status          | id                         | uuid                     | NO          | gen_random_uuid()                 |
| member_compliance_status          | user_id                    | uuid                     | YES         | null                              |
| member_compliance_status          | requirement_id             | uuid                     | YES         | null                              |
| member_compliance_status          | status                     | character varying        | YES         | 'pending'::character varying      |
| member_compliance_status          | last_checked               | timestamp with time zone | YES         | now()                             |
| member_compliance_status          | next_due_date              | date                     | YES         | null                              |
| member_compliance_status          | compliance_data            | jsonb                    | YES         | '{}'::jsonb                       |
| member_compliance_status          | checked_by                 | uuid                     | YES         | null                              |
| member_compliance_status          | created_at                 | timestamp with time zone | YES         | now()                             |
| member_compliance_status          | updated_at                 | timestamp with time zone | YES         | now()                             |
| user_compliance_records           | id                         | uuid                     | NO          | gen_random_uuid()                 |
| user_compliance_records           | user_id                    | uuid                     | NO          | null                              |
| user_compliance_records           | metric_id                  | uuid                     | NO          | null                              |
| user_compliance_records           | requirement_id             | uuid                     | YES         | null                              |
| user_compliance_records           | status                     | character varying        | YES         | 'pending'::character varying      |
| user_compliance_records           | compliance_status          | character varying        | YES         | 'pending'::character varying      |
| user_compliance_records           | completion_percentage      | integer                  | YES         | 0                                 |
| user_compliance_records           | current_value              | text                     | YES         | null                              |
| user_compliance_records           | target_value               | text                     | YES         | null                              |
| user_compliance_records           | evidence_files             | jsonb                    | YES         | '[]'::jsonb                       |
| user_compliance_records           | submission_data            | jsonb                    | YES         | '{}'::jsonb                       |
| user_compliance_records           | reviewed_at                | timestamp with time zone | YES         | null                              |
| user_compliance_records           | reviewer_id                | uuid                     | YES         | null                              |
| user_compliance_records           | review_notes               | text                     | YES         | null                              |
| user_compliance_records           | approved_at                | timestamp with time zone | YES         | null                              |
| user_compliance_records           | approved_by                | uuid                     | YES         | null                              |
| user_compliance_records           | rejection_reason           | text                     | YES         | null                              |
| user_compliance_records           | due_date                   | timestamp with time zone | YES         | null                              |
| user_compliance_records           | reminder_sent_at           | timestamp with time zone | YES         | null                              |
| user_compliance_records           | last_checked_at            | timestamp with time zone | YES         | now()                             |
| user_compliance_records           | next_review_date           | timestamp with time zone | YES         | null                              |
| user_compliance_records           | tier                       | character varying        | YES         | 'basic'::character varying        |
| user_compliance_records           | priority                   | integer                  | YES         | 5                                 |
| user_compliance_records           | metadata                   | jsonb                    | YES         | '{}'::jsonb                       |
| user_compliance_records           | created_at                 | timestamp with time zone | YES         | now()                             |
| user_compliance_records           | updated_at                 | timestamp with time zone | YES         | now()                             |
| user_compliance_records           | notes                      | text                     | YES         | null                              |