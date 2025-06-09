
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { ComplianceService } from '@/services/team/complianceService';
import type { TeamMemberWithProfile } from '@/types/team-management';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface MemberCompliancePanelProps {
  teamId: string;
  members: TeamMemberWithProfile[];
}

export function MemberCompliancePanel({ teamId, members }: MemberCompliancePanelProps) {
  const { data: complianceOverview, isLoading } = useQuery({
    queryKey: ['team-compliance-overview', teamId],
    queryFn: () => ComplianceService.getTeamComplianceOverview(teamId),
    refetchInterval: 300000
  });

  const { data: memberCompliance = [] } = useQuery({
    queryKey: ['member-compliance', teamId],
    queryFn: async () => {
      const compliancePromises = members.map(async (member) => {
        const compliance = await ComplianceService.checkMemberCompliance(member.user_id);
        return {
          ...member,
          compliance
        };
      });
      return Promise.all(compliancePromises);
    },
    enabled: members.length > 0,
    refetchInterval: 300000
  });

  const getComplianceStatusIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 70) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getComplianceStatusBadge = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 70) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {complianceOverview?.compliantCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {complianceOverview?.nonCompliantCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Non-Compliant</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {complianceOverview?.pendingCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(complianceOverview?.complianceRate || 0)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Rate</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Team Compliance Rate</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(complianceOverview?.complianceRate || 0)}%
              </span>
            </div>
            <Progress value={complianceOverview?.complianceRate || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Individual Member Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Member Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberCompliance.map((member) => {
              const complianceRate = member.compliance?.compliance_percentage || 0;
              
              return (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {(member.profiles?.display_name || member.display_name).charAt(0)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="font-medium">
                        {member.profiles?.display_name || member.display_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.role} • {member.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getComplianceStatusIcon(complianceRate)}
                        <span className="text-sm font-medium">
                          {Math.round(complianceRate)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.compliance?.compliant_count || 0} of {member.compliance?.total_requirements || 0} complete
                      </div>
                    </div>
                    
                    <Badge variant={getComplianceStatusBadge(complianceRate)}>
                      {complianceRate >= 90 ? 'Compliant' : 
                       complianceRate >= 70 ? 'At Risk' : 'Non-Compliant'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
