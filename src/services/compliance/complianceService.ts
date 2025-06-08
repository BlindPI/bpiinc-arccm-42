
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceMetrics {
  teamId: string;
  teamName: string;
  complianceScore: number;
  criticalIssues: number;
  pendingActions: number;
  lastAssessment: string | null;
  memberCount: number;
  status: 'compliant' | 'warning' | 'critical';
}

export interface SystemComplianceOverview {
  overallScore: number;
  compliantTeams: number;
  warningTeams: number;
  criticalTeams: number;
  totalTeams: number;
}

export class ComplianceService {
  async getTeamComplianceMetrics(): Promise<ComplianceMetrics[]> {
    try {
      // Get teams with member counts
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          status,
          performance_score
        `);

      if (teamsError) throw teamsError;

      // Get team member counts
      const { data: memberCounts, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Get compliance assessments
      const { data: assessments, error: assessmentError } = await supabase
        .from('compliance_assessments')
        .select('overall_score, created_at')
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      // Get compliance issues
      const { data: issues, error: issuesError } = await supabase
        .from('compliance_issues')
        .select('user_id, severity, status')
        .in('status', ['OPEN', 'IN_PROGRESS']);

      if (issuesError) throw issuesError;

      // Count members per team
      const memberCountByTeam = memberCounts?.reduce((acc, member) => {
        acc[member.team_id] = (acc[member.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return (teams || []).map(team => {
        const memberCount = memberCountByTeam[team.id] || 0;
        const latestAssessment = assessments?.[0];
        const baseScore = latestAssessment?.overall_score || team.performance_score || 0;
        
        // Calculate compliance score based on actual assessment data
        const complianceScore = this.calculateTeamComplianceScore(baseScore, team.status);
        
        // Count issues (simplified - in reality would need team-user mapping)
        const criticalIssues = issues?.filter(issue => issue.severity === 'HIGH').length || 0;
        const pendingActions = issues?.filter(issue => issue.status === 'OPEN').length || 0;

        return {
          teamId: team.id,
          teamName: team.name,
          complianceScore,
          criticalIssues,
          pendingActions,
          lastAssessment: latestAssessment?.created_at || null,
          memberCount,
          status: this.determineComplianceStatus(complianceScore, criticalIssues)
        };
      });
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return [];
    }
  }

  async getSystemComplianceOverview(): Promise<SystemComplianceOverview> {
    const teamMetrics = await this.getTeamComplianceMetrics();
    
    const compliantTeams = teamMetrics.filter(team => team.status === 'compliant').length;
    const warningTeams = teamMetrics.filter(team => team.status === 'warning').length;
    const criticalTeams = teamMetrics.filter(team => team.status === 'critical').length;
    
    const overallScore = teamMetrics.length > 0 
      ? Math.round(teamMetrics.reduce((sum, team) => sum + team.complianceScore, 0) / teamMetrics.length)
      : 0;

    return {
      overallScore,
      compliantTeams,
      warningTeams,
      criticalTeams,
      totalTeams: teamMetrics.length
    };
  }

  async resolveIssue(issueId: string, userId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_issues')
      .update({
        status: 'RESOLVED',
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', issueId);

    if (error) throw error;
  }

  async updateIssueStatus(issueId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_issues')
      .update({ status })
      .eq('id', issueId);

    if (error) throw error;
  }

  async exportComplianceData(): Promise<Blob> {
    const teamMetrics = await this.getTeamComplianceMetrics();
    const csvContent = this.convertToCSV(teamMetrics);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private convertToCSV(data: ComplianceMetrics[]): string {
    const headers = ['Team ID', 'Team Name', 'Compliance Score', 'Critical Issues', 'Status'];
    const rows = data.map(item => [
      item.teamId,
      item.teamName,
      item.complianceScore.toString(),
      item.criticalIssues.toString(),
      item.status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private calculateTeamComplianceScore(assessmentScore: number, teamStatus: string): number {
    let score = assessmentScore;
    
    // Adjust score based on team status
    if (teamStatus === 'inactive') {
      score = Math.max(0, score - 20);
    } else if (teamStatus === 'suspended') {
      score = 0;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  private determineComplianceStatus(score: number, criticalIssues: number): 'compliant' | 'warning' | 'critical' {
    if (criticalIssues > 0 || score < 60) {
      return 'critical';
    } else if (score < 80) {
      return 'warning';
    }
    return 'compliant';
  }
}

export const complianceService = new ComplianceService();
