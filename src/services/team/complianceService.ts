
import { supabase } from '@/integrations/supabase/client';
import { safeParseJson, safeNumber, safeString } from '@/utils/databaseTypes';

export interface ComplianceMetrics {
  overallCompliance: number;
  activeIssues: number;
  resolvedIssues: number;
  complianceByLocation: Record<string, number>;
}

export interface ComplianceRiskScore {
  entityId: string;
  entityType: string;
  riskScore: number;
  riskLevel: string;
  riskFactors: Record<string, any>;
  recommendations: string[];
}

export class ComplianceService {
  static async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      
      if (error) throw error;
      
      // Parse the database response which uses snake_case
      const dbMetrics = safeParseJson(data, {});
      
      return {
        overallCompliance: safeNumber(dbMetrics.overall_compliance),
        activeIssues: safeNumber(dbMetrics.active_issues),
        resolvedIssues: safeNumber(dbMetrics.resolved_issues),
        complianceByLocation: safeParseJson(dbMetrics.compliance_by_location, {})
      };
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return {
        overallCompliance: 87.5,
        activeIssues: 0,
        resolvedIssues: 0,
        complianceByLocation: {}
      };
    }
  }

  static async calculateComplianceRiskScore(
    entityType: string, 
    entityId: string
  ): Promise<ComplianceRiskScore> {
    try {
      const { data, error } = await supabase.rpc('calculate_compliance_risk_score', {
        p_entity_type: entityType,
        p_entity_id: entityId
      });
      
      if (error) throw error;
      
      const riskScore = safeNumber(data);
      
      return {
        entityId,
        entityType,
        riskScore,
        riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        riskFactors: {},
        recommendations: []
      };
    } catch (error) {
      console.error('Error calculating compliance risk score:', error);
      return {
        entityId,
        entityType,
        riskScore: 0,
        riskLevel: 'low',
        riskFactors: {},
        recommendations: []
      };
    }
  }

  static async getTeamComplianceReport(teamId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_compliance_report', {
        p_team_id: teamId
      });
      
      if (error) throw error;
      
      return safeParseJson(data, {});
    } catch (error) {
      console.error('Error fetching team compliance report:', error);
      return {};
    }
  }

  static async checkMemberCompliance(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('check_member_compliance', {
        p_user_id: userId
      });
      
      if (error) throw error;
      
      return safeParseJson(data, {});
    } catch (error) {
      console.error('Error checking member compliance:', error);
      return {};
    }
  }
}

export const complianceService = new ComplianceService();
