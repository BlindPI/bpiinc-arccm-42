
import { supabase } from '@/integrations/supabase/client';
import type { 
  AuditTrailEntry, 
  ComplianceViolation, 
  RiskAssessment, 
  RegulatoryReport 
} from '@/types/governance';

// Type guards for safe casting
function safeCastSeverity(value: string): 'low' | 'medium' | 'high' | 'critical' {
  const validValues = ['low', 'medium', 'high', 'critical'] as const;
  return validValues.includes(value as any) ? (value as any) : 'medium';
}

function safeCastRiskLevel(value: string): 'low' | 'medium' | 'high' | 'critical' {
  const validValues = ['low', 'medium', 'high', 'critical'] as const;
  return validValues.includes(value as any) ? (value as any) : 'medium';
}

function safeCastReportStatus(value: string): 'draft' | 'in_review' | 'approved' | 'submitted' | 'acknowledged' {
  const validValues = ['draft', 'in_review', 'approved', 'submitted', 'acknowledged'] as const;
  return validValues.includes(value as any) ? (value as any) : 'draft';
}

function safeCastIpAddress(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return undefined;
  return String(value);
}

export class AuditComplianceService {
  static async getAuditTrail(
    entityType?: string,
    entityId?: string,
    limit: number = 100
  ): Promise<AuditTrailEntry[]> {
    let query = supabase
      .from('audit_trail')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      ip_address: safeCastIpAddress(item.ip_address),
      risk_level: safeCastRiskLevel(item.risk_level || 'low'),
      compliance_flags: Array.isArray(item.compliance_flags) ? item.compliance_flags : [],
      metadata: typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {},
      before_state: typeof item.before_state === 'object' && item.before_state !== null ? item.before_state : undefined,
      after_state: typeof item.after_state === 'object' && item.after_state !== null ? item.after_state : undefined,
      created_at: item.created_at || new Date().toISOString(),
      user_id: item.user_id || undefined,
      session_id: item.session_id || undefined,
      user_agent: item.user_agent || undefined,
      change_summary: item.change_summary || undefined
    })) as AuditTrailEntry[];
  }

  static async createAuditEntry(entry: Omit<AuditTrailEntry, 'id' | 'created_at'>): Promise<AuditTrailEntry> {
    const { data, error } = await supabase
      .from('audit_trail')
      .insert({
        ...entry,
        ip_address: entry.ip_address || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      ip_address: safeCastIpAddress(data.ip_address),
      risk_level: safeCastRiskLevel(data.risk_level || 'low'),
      compliance_flags: Array.isArray(data.compliance_flags) ? data.compliance_flags : [],
      metadata: typeof data.metadata === 'object' && data.metadata !== null ? data.metadata : {},
      before_state: typeof data.before_state === 'object' && data.before_state !== null ? data.before_state : undefined,
      after_state: typeof data.after_state === 'object' && data.after_state !== null ? data.after_state : undefined
    } as AuditTrailEntry;
  }

  static async getComplianceViolations(
    entityType?: string,
    entityId?: string
  ): Promise<ComplianceViolation[]> {
    let query = supabase
      .from('compliance_violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      severity: safeCastSeverity(item.severity || 'medium'),
      status: item.status || 'open',
      remediation_actions: Array.isArray(item.remediation_actions) ? item.remediation_actions : [],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      detected_at: item.detected_at || new Date().toISOString(),
      violation_description: item.violation_description || undefined,
      assigned_to: item.assigned_to || undefined,
      resolution_notes: item.resolution_notes || undefined,
      resolved_at: item.resolved_at || undefined,
      resolved_by: item.resolved_by || undefined
    })) as ComplianceViolation[];
  }

  static async createComplianceViolation(
    violation: Omit<ComplianceViolation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ComplianceViolation> {
    const { data, error } = await supabase
      .from('compliance_violations')
      .insert({
        ...violation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      severity: safeCastSeverity(data.severity || 'medium'),
      remediation_actions: Array.isArray(data.remediation_actions) ? data.remediation_actions : []
    } as ComplianceViolation;
  }

  static async getRiskAssessments(
    entityType?: string,
    entityId?: string
  ): Promise<RiskAssessment[]> {
    let query = supabase
      .from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      risk_level: safeCastRiskLevel(item.risk_level || 'medium'),
      status: item.status || 'identified',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      entity_type: item.entity_type || undefined,
      entity_id: item.entity_id || undefined,
      identified_by: item.identified_by || undefined,
      owner_id: item.owner_id || undefined,
      risk_description: item.risk_description || undefined,
      mitigation_plan: item.mitigation_plan || undefined,
      mitigation_deadline: item.mitigation_deadline || undefined,
      review_date: item.review_date || undefined
    })) as RiskAssessment[];
  }

  static async createRiskAssessment(
    assessment: Omit<RiskAssessment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RiskAssessment> {
    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        ...assessment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      risk_level: safeCastRiskLevel(data.risk_level || 'medium')
    } as RiskAssessment;
  }

  static async getRegulatoryReports(): Promise<RegulatoryReport[]> {
    const { data, error } = await supabase
      .from('regulatory_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      report_status: safeCastReportStatus(item.report_status || 'draft'),
      report_data: typeof item.report_data === 'object' && item.report_data !== null ? item.report_data : {},
      acknowledgment_received: Boolean(item.acknowledgment_received),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      submission_deadline: item.submission_deadline || undefined,
      submission_method: item.submission_method || undefined,
      submission_reference: item.submission_reference || undefined,
      submitted_by: item.submitted_by || undefined,
      submitted_at: item.submitted_at || undefined,
      created_by: item.created_by || undefined
    })) as RegulatoryReport[];
  }

  static async createRegulatoryReport(
    report: Omit<RegulatoryReport, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RegulatoryReport> {
    const { data, error } = await supabase
      .from('regulatory_reports')
      .insert({
        ...report,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      report_status: safeCastReportStatus(data.report_status || 'draft'),
      report_data: typeof data.report_data === 'object' && data.report_data !== null ? data.report_data : {},
      acknowledgment_received: Boolean(data.acknowledgment_received)
    } as RegulatoryReport;
  }
}
