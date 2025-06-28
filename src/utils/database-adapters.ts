
import { safeJsonCast } from '@/types/compliance-tier-standardized';

// Database field casting utilities
export class DatabaseAdapters {
  // Cast JSONB fields safely
  static castJsonbField<T>(value: any, defaultValue: T): T {
    return safeJsonCast(value, defaultValue);
  }

  // Adapt EmailCampaign from database with proper field mapping
  static adaptEmailCampaign(dbCampaign: any) {
    return {
      ...dbCampaign,
      // Map database fields to component interface
      name: dbCampaign.campaign_name || dbCampaign.name,
      subject: dbCampaign.subject || `${dbCampaign.campaign_name} Campaign`,
      sent_count: dbCampaign.sent_count || 0, // Use correct field name
      campaign_type: dbCampaign.campaign_type || 'newsletter',
      automation_rules: this.castJsonbField(dbCampaign.automation_rules, {}),
      target_audience: this.castJsonbField(dbCampaign.target_audience, {})
    };
  }

  // Adapt requirement validation rules
  static adaptValidationRules(dbRules: any) {
    const rules = this.castJsonbField(dbRules, {});
    return {
      file_types: rules.file_types || [],
      max_file_size: rules.max_file_size || 10485760, // 10MB default
      min_score: rules.min_score || 0,
      completion_evidence_required: rules.completion_evidence_required || false
    };
  }

  // Adapt compliance requirement from database
  static adaptComplianceRequirement(dbReq: any) {
    return {
      id: dbReq.id,
      name: dbReq.name,
      description: dbReq.description,
      category: dbReq.category,
      tier: dbReq.tier,
      requirement_type: dbReq.requirement_type || 'form',
      current_status: dbReq.current_status || dbReq.status || 'pending',
      due_date: dbReq.due_date,
      completion_date: dbReq.completion_date,
      assigned_roles: this.castJsonbField(dbReq.assigned_roles, []),
      validation_rules: this.adaptValidationRules(dbReq.validation_rules),
      ui_component: dbReq.ui_component || 'form',
      external_url: dbReq.external_url,
      external_system: dbReq.external_system,
      metadata: this.castJsonbField(dbReq.metadata, {})
    };
  }

  // Adapt user compliance record from database with correct field names
  static adaptUserComplianceRecord(dbRecord: any) {
    return {
      id: dbRecord.id,
      user_id: dbRecord.user_id,
      requirement_id: dbRecord.requirement_id,
      current_status: dbRecord.current_status || 'pending',
      completion_percentage: dbRecord.completion_percentage || 0,
      review_notes: dbRecord.review_notes || '', // Use correct field name
      due_date: dbRecord.due_date,
      completed_at: dbRecord.completed_at,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at
    };
  }

  // NEW: Adapt workflow approval data with proper field mapping
  static adaptWorkflowApproval(dbApproval: any) {
    return {
      id: dbApproval.id,
      workflow_instance_id: dbApproval.workflow_instance_id,
      approver_id: dbApproval.approver_id,
      approval_status: dbApproval.approval_status,
      approval_date: dbApproval.approval_date,
      comments: dbApproval.comments || '',
      approval_method: dbApproval.approval_method || 'manual', // Add default value
      step_number: dbApproval.step_number,
      created_at: dbApproval.created_at
    };
  }

  // NEW: Adapt notification preferences
  static adaptNotificationPreferences(dbPrefs: any) {
    return {
      id: dbPrefs.id,
      user_id: dbPrefs.user_id,
      category: dbPrefs.notification_type || dbPrefs.category,
      in_app_enabled: dbPrefs.enabled || dbPrefs.in_app_enabled || false,
      email_enabled: dbPrefs.email_notifications || dbPrefs.email_enabled || false,
      browser_enabled: dbPrefs.push_notifications || dbPrefs.browser_enabled || false,
      created_at: dbPrefs.created_at,
      updated_at: dbPrefs.updated_at
    };
  }
}
