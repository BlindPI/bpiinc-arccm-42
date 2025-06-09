
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceIssue {
  id: string;
  user_id: string;
  issue_type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceMetrics {
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
  compliance_by_location: Record<string, any>;
}

export class ComplianceService {
  // Get compliance issues for a team
  static async getTeamComplianceIssues(teamId: string): Promise<ComplianceIssue[]> {
    try {
      const { data, error } = await supabase
        .from('compliance_issues')
        .select(`
          *,
          profiles!inner(id, display_name)
        `)
        .in('user_id', 
          await this.getTeamMemberIds(teamId)
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        issue_type: item.issue_type,
        description: item.description,
        severity: item.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        status: item.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
        due_date: item.due_date,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch team compliance issues:', error);
      return [];
    }
  }

  // Get compliance metrics using real database function
  static async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      
      if (error) throw error;
      
      const metricsData = this.safeParseJsonResponse(data);
      
      return {
        overall_compliance: metricsData.overall_compliance || 0,
        active_issues: metricsData.active_issues || 0,
        resolved_issues: metricsData.resolved_issues || 0,
        compliance_by_location: metricsData.compliance_by_location || {}
      };
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error);
      return {
        overall_compliance: 0,
        active_issues: 0,
        resolved_issues: 0,
        compliance_by_location: {}
      };
    }
  }

  // Get team compliance report using real database function
  static async getTeamComplianceReport(teamId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_compliance_report', {
        p_team_id: teamId
      });
      
      if (error) throw error;
      
      return this.safeParseJsonResponse(data);
    } catch (error) {
      console.error('Failed to fetch team compliance report:', error);
      return {};
    }
  }

  // Create a compliance issue
  static async createComplianceIssue(issue: Partial<ComplianceIssue>): Promise<ComplianceIssue | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_issues')
        .insert({
          user_id: issue.user_id,
          issue_type: issue.issue_type,
          description: issue.description,
          severity: issue.severity || 'MEDIUM',
          status: 'OPEN',
          due_date: issue.due_date
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        user_id: data.user_id,
        issue_type: data.issue_type,
        description: data.description,
        severity: data.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        status: data.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Failed to create compliance issue:', error);
      return null;
    }
  }

  // Resolve a compliance issue
  static async resolveComplianceIssue(issueId: string, resolvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_issues')
        .update({
          status: 'RESOLVED',
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', issueId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving compliance issue:', error);
      throw error;
    }
  }

  // Helper function to get team member IDs
  private static async getTeamMemberIds(teamId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (error) throw error;
      return data?.map(m => m.user_id) || [];
    } catch (error) {
      console.error('Error fetching team member IDs:', error);
      return [];
    }
  }

  private static safeParseJsonResponse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data || {};
  }
}
