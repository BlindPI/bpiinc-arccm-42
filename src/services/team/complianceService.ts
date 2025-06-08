
import { supabase } from '@/integrations/supabase/client';
import type { 
  ComplianceRequirement, 
  MemberComplianceStatus, 
  ComplianceSummary 
} from '@/types/enhanced-team-management';

export class ComplianceService {
  static async getComplianceRequirements(): Promise<ComplianceRequirement[]> {
    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('is_mandatory', true)
        .order('requirement_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching compliance requirements:', error);
      return [];
    }
  }

  static async getUserComplianceStatus(userId: string): Promise<MemberComplianceStatus[]> {
    try {
      const { data, error } = await supabase
        .from('member_compliance_status')
        .select(`
          *,
          compliance_requirements(*)
        `)
        .eq('user_id', userId)
        .order('last_checked', { ascending: false });

      if (error) throw error;

      return (data || []).map(status => ({
        ...status,
        requirement: (status as any).compliance_requirements
      }));
    } catch (error) {
      console.error('Error fetching user compliance status:', error);
      return [];
    }
  }

  static async checkMemberCompliance(userId: string): Promise<ComplianceSummary | null> {
    try {
      const { data, error } = await supabase.rpc('check_member_compliance', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking member compliance:', error);
      return null;
    }
  }

  static async updateComplianceStatus(
    userId: string,
    requirementId: string,
    status: 'compliant' | 'non_compliant' | 'pending' | 'expired',
    complianceData: Record<string, any> = {},
    checkedBy?: string
  ): Promise<MemberComplianceStatus | null> {
    try {
      const { data, error } = await supabase
        .from('member_compliance_status')
        .upsert({
          user_id: userId,
          requirement_id: requirementId,
          status,
          compliance_data: complianceData,
          checked_by: checkedBy,
          last_checked: new Date().toISOString(),
          next_due_date: this.calculateNextDueDate(status, requirementId)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating compliance status:', error);
      return null;
    }
  }

  static async getTeamComplianceOverview(teamId: string): Promise<{
    teamCompliance: number;
    memberSummaries: Array<{
      user_id: string;
      display_name: string;
      compliance_percentage: number;
      non_compliant_count: number;
    }>;
  }> {
    try {
      // Get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles!inner(display_name)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const memberSummaries = [];
      let totalCompliance = 0;

      for (const member of teamMembers || []) {
        const compliance = await this.checkMemberCompliance(member.user_id);
        if (compliance) {
          memberSummaries.push({
            user_id: member.user_id,
            display_name: (member.profiles as any)?.display_name || 'Unknown',
            compliance_percentage: compliance.compliance_percentage,
            non_compliant_count: compliance.total_requirements - compliance.compliant_count
          });
          totalCompliance += compliance.compliance_percentage;
        }
      }

      const teamCompliance = memberSummaries.length > 0 
        ? totalCompliance / memberSummaries.length 
        : 0;

      return {
        teamCompliance,
        memberSummaries
      };
    } catch (error) {
      console.error('Error fetching team compliance overview:', error);
      return {
        teamCompliance: 0,
        memberSummaries: []
      };
    }
  }

  private static calculateNextDueDate(status: string, requirementId: string): string | null {
    // This would typically calculate based on the requirement's frequency
    // For now, return a default 30 days from now for compliant items
    if (status === 'compliant') {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      return nextDue.toISOString().split('T')[0];
    }
    return null;
  }
}

export const complianceService = new ComplianceService();
