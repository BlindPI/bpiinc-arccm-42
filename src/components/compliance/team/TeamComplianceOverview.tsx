import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  User
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function TeamComplianceOverview() {
  const { state } = useComplianceDashboard();
  const { providerSummary, teamMemberCompliance } = state.data;

  if (!providerSummary) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    return 'Needs Attention';
  };

  // Get team breakdown
  const teamBreakdown = teamMemberCompliance.reduce((teams, member) => {
    const teamName = member.team_name;
    if (!teams[teamName]) {
      teams[teamName] = {
        total: 0,
        compliant: 0,
        warning: 0,
        non_compliant: 0,
        pending: 0
      };
    }
    teams[teamName].total++;
    teams[teamName][member.compliance_status]++;
    return teams;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      {/* Main Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Team Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{providerSummary.total_members}</div>
              <div className="text-sm text-gray-500">Total Members</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(providerSummary.overall_compliance_rate)}`}>
                {providerSummary.overall_compliance_rate}%
              </div>
              <div className="text-sm text-gray-500">Compliance Rate</div>
              <div className="text-xs text-gray-400">
                {getStatusText(providerSummary.overall_compliance_rate)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {providerSummary.total_pending_actions}
              </div>
              <div className="text-sm text-gray-500">Pending Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {providerSummary.total_overdue_actions}
              </div>
              <div className="text-sm text-gray-500">Overdue Actions</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Team Compliance</span>
              <span>{providerSummary.overall_compliance_rate}%</span>
            </div>
            <Progress value={providerSummary.overall_compliance_rate} className="h-3" />
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Compliant: {providerSummary.compliant_members}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Warning: {providerSummary.warning_members}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Non-Compliant: {providerSummary.non_compliant_members}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Pending: {providerSummary.pending_members}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Breakdown */}
      {Object.keys(teamBreakdown).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(teamBreakdown).map(([teamName, stats]: [string, any]) => {
                const complianceRate = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;
                
                return (
                  <div key={teamName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{teamName}</span>
                        <Badge variant="outline">{stats.total} members</Badge>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getStatusColor(complianceRate)}`}>
                          {complianceRate}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.compliant}/{stats.total} compliant
                        </div>
                      </div>
                    </div>
                    
                    <Progress value={complianceRate} className="h-2 mb-2" />
                    
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span className="text-green-600">✓ {stats.compliant} compliant</span>
                      {stats.warning > 0 && <span className="text-yellow-600">⚠ {stats.warning} warning</span>}
                      {stats.non_compliant > 0 && <span className="text-red-600">✗ {stats.non_compliant} non-compliant</span>}
                      {stats.pending > 0 && <span className="text-blue-600">○ {stats.pending} pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}