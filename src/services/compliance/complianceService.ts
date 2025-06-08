
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
      // Get teams with member counts and compliance data
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          status,
          team_members(count),
          compliance_assessments(
            overall_score,
            assessment_status,
            created_at
          )
        `);

      if (teamsError) throw teamsError;

      // Get compliance issues for each team
      const { data: issues, error: issuesError } = await supabase
        .from('compliance_issues')
        .select('user_id, severity, status')
        .in('status', ['OPEN', 'IN_PROGRESS']);

      if (issuesError) throw issuesError;

      return teams.map(team => {
        const memberCount = team.team_members?.[0]?.count || 0;
        const latestAssessment = team.compliance_assessments?.[0];
        const baseScore = latestAssessment?.overall_score || 0;
        
        // Calculate compliance score based on actual assessment data
        const complianceScore = this.calculateTeamComplianceScore(baseScore, team.status);
        
        // Count actual issues for team members
        const teamIssues = issues.filter(issue => 
          team.team_members?.some(member => member.user_id === issue.user_id)
        );
        
        const criticalIssues = teamIssues.filter(issue => issue.severity === 'HIGH').length;
        const pendingActions = teamIssues.filter(issue => issue.status === 'OPEN').length;

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
