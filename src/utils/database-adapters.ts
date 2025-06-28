
import { safeJsonCast } from '@/types/compliance-tier-standardized';

// Database field casting utilities
export class DatabaseAdapters {
  // Cast JSONB fields safely
  static castJsonbField<T>(value: any, defaultValue: T): T {
    return safeJsonCast(value, defaultValue);
  }

  // Adapt EmailCampaign from database
  static adaptEmailCampaign(dbCampaign: any) {
    return {
      ...dbCampaign,
      campaign_type: dbCampaign.campaign_type || 'newsletter',
      sent_count: dbCampaign.total_recipients || dbCampaign.sent_count || 0,
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
      status: dbReq.status || 'pending',
      due_date: dbReq.due_date,
      completion_date: dbReq.completion_date,
      type: dbReq.requirement_type || 'form',
      assigned_roles: this.castJsonbField(dbReq.assigned_roles, []),
      validation_rules: this.adaptValidationRules(dbReq.validation_rules),
      ui_component: dbReq.ui_component || 'form',
      external_url: dbReq.external_url,
      external_system: dbReq.external_system,
      metadata: this.castJsonbField(dbReq.metadata, {})
    };
  }
}
