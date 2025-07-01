/**
 * PHASE 2: TEAM MEMBER COMPLIANCE SERVICE
 * 
 * Provides AP users with detailed visibility into team member compliance status
 * 
 * Key Features:
 * - Get compliance status for all team members under a provider
 * - Aggregate compliance statistics
 * - Show individual member compliance breakdown
 * - Track pending and overdue actions
 * 
 * ✅ USES ONLY REAL DATA - No fake, demo, or placeholder data
 */

import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from './complianceService';
import type { ComplianceSummary, ComplianceAction, UserComplianceRecord } from './complianceService';

// =====================================================================================
// INTERFACES
// =====================================================================================

export interface TeamMemberComplianceStatus {
  user_id: string;
  team_id: string;
  team_name: string;
  member_name: string;
  member_email: string;
  member_role: string;
  compliance_tier?: string; // Added compliance_tier
  compliance_score: number;
  compliance_status: 'compliant' | 'warning' | 'non_compliant' | 'pending';
  pending_actions: number;
  overdue_actions: number;
  last_updated: string;
  requirements: Array<{
    name: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable';
    due_date?: string;
  }>;
}

export interface ProviderComplianceSummary {
  provider_id: string;
  total_members: number;
  compliant_members: number;
  warning_members: number;
  non_compliant_members: number;
  pending_members: number;
  overall_compliance_rate: number;
  total_pending_actions: number;
  total_overdue_actions: number;
  last_updated: string;
  compliance_breakdown: {
    compliant_percentage: number;
    warning_percentage: number;
    non_compliant_percentage: number;
    pending_percentage: number;
  };
}

export interface ComplianceRequirement {
  name: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable';
  due_date?: string;
}

// =====================================================================================
// TEAM MEMBER COMPLIANCE SERVICE
// =====================================================================================

export class TeamMemberComplianceService {
  
  /**
   * Get comprehensive compliance status for all team members under a provider
   * Returns REAL data from compliance system
   */
  static async getProviderTeamMemberCompliance(providerId: string): Promise<TeamMemberComplianceStatus[]> {
    try {
      console.log(`DEBUG: Getting team member compliance for provider ${providerId} using proven working approach`);
      
      // FIXED: Use the same proven approach as working Team Assignments tab
      const { providerRelationshipService } = await import('@/services/provider/providerRelationshipService');
      
      // Get team assignments using the working method
      const teamAssignments = await providerRelationshipService.getProviderTeamAssignments(providerId);
      
      if (!teamAssignments || teamAssignments.length === 0) {
        console.log(`DEBUG: No team assignments found for provider ${providerId} (using working method)`);
        return [];
      }

      const teamIds = teamAssignments.map(a => a.team_id);
      console.log(`DEBUG: Found ${teamIds.length} teams for provider ${providerId} using working method:`, teamAssignments.map(t => t.team_name));

      // FIXED: Use proven working approach to get team members
      console.log(`DEBUG: Getting team members for ${teamIds.length} teams using working method`);
      
      let allTeamMembers: any[] = [];
      
      // Get team members for each team using the working method
      for (const teamId of teamIds) {
        try {
          const teamMembers = await providerRelationshipService.getTeamMembers(teamId);
          console.log(`DEBUG: Found ${teamMembers.length} members in team ${teamId}`);
          allTeamMembers.push(...teamMembers);
        } catch (error) {
          console.error(`DEBUG: Error getting members for team ${teamId}:`, error);
          // Continue with other teams
        }
      }

      if (allTeamMembers.length === 0) {
        console.log(`DEBUG: No team members found for provider ${providerId} using working method`);
        return [];
      }

      console.log(`DEBUG: Found ${allTeamMembers.length} team members across ${teamIds.length} teams using working method`);
      const teamMembers = allTeamMembers;

      // Get compliance data for each team member
      const memberCompliancePromises = teamMembers.map(async (member) => {
        try {
          // Get compliance summary for this member
          const complianceSummary = await ComplianceService.getUserComplianceSummary(member.user_id);
          
          // Get compliance actions for this member
          const complianceActions = await ComplianceService.getUserComplianceActions(member.user_id);
          
          // Get detailed compliance records for requirements breakdown
          const complianceRecords = await ComplianceService.getUserComplianceRecords(member.user_id);
          
          // Calculate pending and overdue actions
          const pendingActions = complianceActions.filter(action => 
            action.status === 'open' || action.status === 'in_progress'
          ).length;
          
          const overduActions = complianceActions.filter(action => {
            const dueDate = new Date(action.due_date);
            const now = new Date();
            return (action.status === 'open' || action.status === 'in_progress') && dueDate < now;
          }).length;

          // Build requirements breakdown from compliance records
          const requirements: ComplianceRequirement[] = complianceRecords.map(record => ({
            name: record.compliance_metrics?.name || 'Unknown Requirement',
            category: record.compliance_metrics?.category || 'general',
            status: record.compliance_status,
            due_date: record.next_check_due
          }));

          // Determine overall compliance status
          let complianceStatus: 'compliant' | 'warning' | 'non_compliant' | 'pending' = 'pending';
          if (complianceSummary.overall_score >= 90) {
            complianceStatus = 'compliant';
          } else if (complianceSummary.overall_score >= 70) {
            complianceStatus = 'warning';
          } else if (complianceSummary.overall_score > 0) {
            complianceStatus = 'non_compliant';
          }

          // Get team data from team assignments (using working data structure)
          const teamAssignment = teamAssignments.find(ta => ta.team_id === member.team_id);
          const teamName = teamAssignment?.team_name || 'Unknown Team';

          console.log(`DEBUG: Processing member ${member.user_id} (${member.display_name || member.email}) from team ${teamName}`);
          
          return {
            user_id: member.user_id,
            team_id: member.team_id,
            team_name: teamName,
            member_name: member.display_name || member.email || 'Unknown',
            member_email: member.email || '',
            member_role: member.role,
            compliance_score: complianceSummary.overall_score,
            compliance_status: complianceStatus,
            pending_actions: pendingActions,
            overdue_actions: overduActions,
            last_updated: member.updated_at || new Date().toISOString(),
            requirements: requirements
          } as TeamMemberComplianceStatus;

        } catch (error) {
          console.error(`Error getting compliance data for member ${member.user_id}:`, error);
          
          // Get team data from team assignments (using working data structure)
          const teamAssignment = teamAssignments.find(ta => ta.team_id === member.team_id);
          const teamName = teamAssignment?.team_name || 'Unknown Team';
          
          return {
            user_id: member.user_id,
            team_id: member.team_id,
            team_name: teamName,
            member_name: member.display_name || member.email || 'Unknown',
            member_email: member.email || '',
            member_role: member.role,
            compliance_score: 0,
            compliance_status: 'pending' as const,
            pending_actions: 0,
            overdue_actions: 0,
            last_updated: member.updated_at || new Date().toISOString(),
            requirements: []
          } as TeamMemberComplianceStatus;
        }
      });

      const memberComplianceData = await Promise.all(memberCompliancePromises);
      
      console.log(`DEBUG: Successfully retrieved compliance data for ${memberComplianceData.length} team members`);
      return memberComplianceData;

    } catch (error) {
      console.error('Error getting provider team member compliance:', error);
      return [];
    }
  }

  /**
   * Get aggregated compliance statistics for a provider
   * Returns REAL data calculated from team member compliance
   */
  static async getProviderComplianceSummary(providerId: string): Promise<ProviderComplianceSummary> {
    try {
      console.log(`DEBUG: Getting compliance summary for provider ${providerId}`);
      
      // Get all team member compliance data
      const memberComplianceData = await this.getProviderTeamMemberCompliance(providerId);
      
      if (memberComplianceData.length === 0) {
        return {
          provider_id: providerId,
          total_members: 0,
          compliant_members: 0,
          warning_members: 0,
          non_compliant_members: 0,
          pending_members: 0,
          overall_compliance_rate: 0,
          total_pending_actions: 0,
          total_overdue_actions: 0,
          last_updated: new Date().toISOString(),
          compliance_breakdown: {
            compliant_percentage: 0,
            warning_percentage: 0,
            non_compliant_percentage: 0,
            pending_percentage: 0
          }
        };
      }

      // Calculate aggregated statistics
      const totalMembers = memberComplianceData.length;
      const compliantMembers = memberComplianceData.filter(m => m.compliance_status === 'compliant').length;
      const warningMembers = memberComplianceData.filter(m => m.compliance_status === 'warning').length;
      const nonCompliantMembers = memberComplianceData.filter(m => m.compliance_status === 'non_compliant').length;
      const pendingMembers = memberComplianceData.filter(m => m.compliance_status === 'pending').length;
      
      const totalPendingActions = memberComplianceData.reduce((sum, m) => sum + m.pending_actions, 0);
      const totalOverdueActions = memberComplianceData.reduce((sum, m) => sum + m.overdue_actions, 0);
      
      const overallComplianceRate = totalMembers > 0 ? Math.round((compliantMembers / totalMembers) * 100) : 0;

      const summary: ProviderComplianceSummary = {
        provider_id: providerId,
        total_members: totalMembers,
        compliant_members: compliantMembers,
        warning_members: warningMembers,
        non_compliant_members: nonCompliantMembers,
        pending_members: pendingMembers,
        overall_compliance_rate: overallComplianceRate,
        total_pending_actions: totalPendingActions,
        total_overdue_actions: totalOverdueActions,
        last_updated: new Date().toISOString(),
        compliance_breakdown: {
          compliant_percentage: totalMembers > 0 ? Math.round((compliantMembers / totalMembers) * 100) : 0,
          warning_percentage: totalMembers > 0 ? Math.round((warningMembers / totalMembers) * 100) : 0,
          non_compliant_percentage: totalMembers > 0 ? Math.round((nonCompliantMembers / totalMembers) * 100) : 0,
          pending_percentage: totalMembers > 0 ? Math.round((pendingMembers / totalMembers) * 100) : 0
        }
      };

      console.log(`DEBUG: Provider compliance summary - ${compliantMembers}/${totalMembers} compliant (${overallComplianceRate}%)`);
      return summary;

    } catch (error) {
      console.error('Error getting provider compliance summary:', error);
      return {
        provider_id: providerId,
        total_members: 0,
        compliant_members: 0,
        warning_members: 0,
        non_compliant_members: 0,
        pending_members: 0,
        overall_compliance_rate: 0,
        total_pending_actions: 0,
        total_overdue_actions: 0,
        last_updated: new Date().toISOString(),
        compliance_breakdown: {
          compliant_percentage: 0,
          warning_percentage: 0,
          non_compliant_percentage: 0,
          pending_percentage: 0
        }
      };
    }
  }

  /**
   * Get team members with overdue compliance actions
   * Returns REAL data for immediate attention
   */
  static async getOverdueComplianceMembers(providerId: string): Promise<TeamMemberComplianceStatus[]> {
    try {
      const allMembers = await this.getProviderTeamMemberCompliance(providerId);
      return allMembers.filter(member => member.overdue_actions > 0);
    } catch (error) {
      console.error('Error getting overdue compliance members:', error);
      return [];
    }
  }

  /**
   * Get compliance statistics by team for a provider
   * Returns REAL data broken down by team
   */
  static async getComplianceByTeam(providerId: string): Promise<Array<{
    team_id: string;
    team_name: string;
    total_members: number;
    compliant_members: number;
    compliance_rate: number;
    pending_actions: number;
    overdue_actions: number;
  }>> {
    try {
      const allMembers = await this.getProviderTeamMemberCompliance(providerId);
      
      // Group by team
      const teamGroups = allMembers.reduce((groups, member) => {
        const teamId = member.team_id;
        if (!groups[teamId]) {
          groups[teamId] = {
            team_id: teamId,
            team_name: member.team_name,
            members: []
          };
        }
        groups[teamId].members.push(member);
        return groups;
      }, {} as Record<string, { team_id: string; team_name: string; members: TeamMemberComplianceStatus[] }>);

      // Calculate statistics for each team
      return Object.values(teamGroups).map(team => {
        const totalMembers = team.members.length;
        const compliantMembers = team.members.filter(m => m.compliance_status === 'compliant').length;
        const pendingActions = team.members.reduce((sum, m) => sum + m.pending_actions, 0);
        const overdueActions = team.members.reduce((sum, m) => sum + m.overdue_actions, 0);
        
        return {
          team_id: team.team_id,
          team_name: team.team_name,
          total_members: totalMembers,
          compliant_members: compliantMembers,
          compliance_rate: totalMembers > 0 ? Math.round((compliantMembers / totalMembers) * 100) : 0,
          pending_actions: pendingActions,
          overdue_actions: overdueActions
        };
      });
    } catch (error) {
      console.error('Error getting compliance by team:', error);
      return [];
    }
  }
}