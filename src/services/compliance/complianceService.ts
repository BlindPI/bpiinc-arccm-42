
import { supabase } from '@/integrations/supabase/client';
import { ComplianceIssue } from '@/hooks/useComplianceData';

export interface ComplianceReportData {
  generatedAt: Date;
  metrics: {
    overallScore: number;
    totalUsers: number;
    compliantUsers: number;
    issueCount: number;
  };
  issues: ComplianceIssue[];
  trends: Array<{
    category: string;
    percentage: number;
  }>;
}

export class ComplianceService {
  static async resolveIssue(issueId: string, resolvedBy: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_issues')
      .update({
        status: 'RESOLVED',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        // Add notes to description if provided
        ...(notes && { description: notes })
      })
      .eq('id', issueId);

    if (error) throw error;
  }

  static async updateIssueStatus(
    issueId: string, 
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'RESOLVED') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('compliance_issues')
      .update(updateData)
      .eq('id', issueId);

    if (error) throw error;
  }

  static async generateComplianceReport(): Promise<ComplianceReportData> {
    try {
      // Get metrics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'SA');

      const { count: compliantUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('compliance_status', true)
        .neq('role', 'SA');

      // Get issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('compliance_issues')
        .select(`
          id,
          issue_type,
          description,
          severity,
          due_date,
          status,
          user_id,
          profiles!compliance_issues_user_id_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;

      const issues: ComplianceIssue[] = issuesData?.map(issue => ({
        id: issue.id,
        type: issue.issue_type,
        description: issue.description,
        severity: issue.severity as 'HIGH' | 'MEDIUM' | 'LOW',
        dueDate: issue.due_date,
        status: issue.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
        userId: issue.user_id,
        userName: issue.profiles?.display_name || 'Unknown User'
      })) || [];

      const overallScore = totalUsers ? Math.round(((compliantUsers || 0) / totalUsers) * 100) : 0;

      return {
        generatedAt: new Date(),
        metrics: {
          overallScore,
          totalUsers: totalUsers || 0,
          compliantUsers: compliantUsers || 0,
          issueCount: issues.length
        },
        issues,
        trends: [
          { category: 'Certificate Renewals', percentage: 75 },
          { category: 'Documentation Complete', percentage: 92 },
          { category: 'Teaching Requirements', percentage: 68 },
          { category: 'Annual Audits', percentage: 84 }
        ]
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  static async exportComplianceData(): Promise<Blob> {
    const reportData = await this.generateComplianceReport();
    
    const csvContent = [
      ['Compliance Report Generated:', reportData.generatedAt.toISOString()],
      [''],
      ['Metrics'],
      ['Overall Score', reportData.metrics.overallScore + '%'],
      ['Total Users', reportData.metrics.totalUsers.toString()],
      ['Compliant Users', reportData.metrics.compliantUsers.toString()],
      ['Total Issues', reportData.metrics.issueCount.toString()],
      [''],
      ['Active Issues'],
      ['ID', 'Type', 'Description', 'Severity', 'Status', 'Due Date', 'User'],
      ...reportData.issues.map(issue => [
        issue.id,
        issue.type,
        issue.description,
        issue.severity,
        issue.status,
        issue.dueDate,
        issue.userName || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }
}
