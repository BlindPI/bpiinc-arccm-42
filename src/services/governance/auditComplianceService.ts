
import { supabase } from '@/integrations/supabase/client';
import type { 
  AuditTrailEntry, 
  ComplianceViolation, 
  RiskAssessment,
  ComplianceFramework,
  RegulatoryReport
} from '@/types/governance';

export class AuditComplianceService {
  // Audit Trail Management
  static async getAuditTrail(
    entityType?: string,
    entityId?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditTrailEntry[]> {
    try {
      let query = supabase
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        before_state: this.parseJsonField(item.before_state),
        after_state: this.parseJsonField(item.after_state),
        compliance_flags: this.parseJsonField(item.compliance_flags) || [],
        metadata: this.parseJsonField(item.metadata) || {}
      }));
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }

  static async createAuditEntry(
    eventType: string,
    entityType: string,
    entityId: string,
    actionPerformed: string,
    beforeState?: Record<string, any>,
    afterState?: Record<string, any>,
    changeSummary?: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
    complianceFlags: string[] = []
  ): Promise<AuditTrailEntry | null> {
    try {
      const { data, error } = await supabase
        .from('audit_trail')
        .insert({
          event_type: eventType,
          entity_type: entityType,
          entity_id: entityId,
          action_performed: actionPerformed,
          before_state: beforeState,
          after_state: afterState,
          change_summary: changeSummary,
          risk_level: riskLevel,
          compliance_flags: complianceFlags,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        before_state: this.parseJsonField(data.before_state),
        after_state: this.parseJsonField(data.after_state),
        compliance_flags: this.parseJsonField(data.compliance_flags) || [],
        metadata: this.parseJsonField(data.metadata) || {}
      };
    } catch (error) {
      console.error('Error creating audit entry:', error);
      return null;
    }
  }

  // Compliance Management
  static async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    try {
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_name');

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        requirements: this.parseJsonField(item.requirements) || {},
        assessment_criteria: this.parseJsonField(item.assessment_criteria) || {}
      }));
    } catch (error) {
      console.error('Error fetching compliance frameworks:', error);
      return [];
    }
  }

  static async getComplianceViolations(
    entityType?: string,
    entityId?: string,
    status?: string
  ): Promise<ComplianceViolation[]> {
    try {
      let query = supabase
        .from('compliance_violations')
        .select('*')
        .order('detected_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        remediation_actions: this.parseJsonField(item.remediation_actions) || []
      }));
    } catch (error) {
      console.error('Error fetching compliance violations:', error);
      return [];
    }
  }

  static async runComplianceCheck(
    entityType: string,
    entityId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('check_compliance_rules', {
        p_entity_type: entityType,
        p_entity_id: entityId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error running compliance check:', error);
    }
  }

  static async resolveComplianceViolation(
    violationId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('compliance_violations')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', violationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resolving compliance violation:', error);
      return false;
    }
  }

  // Risk Assessment Management
  static async getRiskAssessments(
    entityType?: string,
    entityId?: string,
    riskLevel?: string
  ): Promise<RiskAssessment[]> {
    try {
      let query = supabase
        .from('risk_assessments')
        .select('*')
        .order('risk_score', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (riskLevel) {
        query = query.eq('risk_level', riskLevel);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      return [];
    }
  }

  static async createRiskAssessment(
    riskData: Omit<RiskAssessment, 'id' | 'risk_score' | 'risk_level' | 'created_at' | 'updated_at'>
  ): Promise<RiskAssessment | null> {
    try {
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert(riskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      return null;
    }
  }

  // Regulatory Reporting
  static async getRegulatoryReports(
    reportType?: string,
    status?: string
  ): Promise<RegulatoryReport[]> {
    try {
      let query = supabase
        .from('regulatory_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      if (status) {
        query = query.eq('report_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        report_data: this.parseJsonField(item.report_data) || {}
      }));
    } catch (error) {
      console.error('Error fetching regulatory reports:', error);
      return [];
    }
  }

  static async createRegulatoryReport(
    reportData: Omit<RegulatoryReport, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RegulatoryReport | null> {
    try {
      const { data, error } = await supabase
        .from('regulatory_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        report_data: this.parseJsonField(data.report_data) || {}
      };
    } catch (error) {
      console.error('Error creating regulatory report:', error);
      return null;
    }
  }

  static async submitRegulatoryReport(
    reportId: string,
    submittedBy: string,
    submissionMethod: string,
    submissionReference?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('regulatory_reports')
        .update({
          report_status: 'submitted',
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString(),
          submission_method: submissionMethod,
          submission_reference: submissionReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting regulatory report:', error);
      return false;
    }
  }

  // Analytics and Metrics
  static async getComplianceMetrics(): Promise<Record<string, any>> {
    try {
      const { data: totalViolations } = await supabase
        .from('compliance_violations')
        .select('id', { count: 'exact' });

      const { data: openViolations } = await supabase
        .from('compliance_violations')
        .select('id', { count: 'exact' })
        .eq('status', 'open');

      const { data: criticalRisks } = await supabase
        .from('risk_assessments')
        .select('id', { count: 'exact' })
        .eq('risk_level', 'critical');

      const { data: pendingReports } = await supabase
        .from('regulatory_reports')
        .select('id', { count: 'exact' })
        .in('report_status', ['draft', 'in_review']);

      const totalCount = totalViolations?.length || 0;
      const openCount = openViolations?.length || 0;
      const complianceRate = totalCount > 0 ? ((totalCount - openCount) / totalCount * 100) : 100;

      return {
        totalViolations: totalCount,
        openViolations: openCount,
        resolvedViolations: totalCount - openCount,
        complianceRate: Math.round(complianceRate * 100) / 100,
        criticalRisks: criticalRisks?.length || 0,
        pendingReports: pendingReports?.length || 0,
        auditTrailEntries: await this.getAuditTrailCount(),
        riskTrend: 'stable' // Would calculate from historical data
      };
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return {
        totalViolations: 0,
        openViolations: 0,
        resolvedViolations: 0,
        complianceRate: 100,
        criticalRisks: 0,
        pendingReports: 0,
        auditTrailEntries: 0,
        riskTrend: 'stable'
      };
    }
  }

  private static async getAuditTrailCount(): Promise<number> {
    const { data } = await supabase
      .from('audit_trail')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    return data?.length || 0;
  }

  private static parseJsonField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field;
  }
}
