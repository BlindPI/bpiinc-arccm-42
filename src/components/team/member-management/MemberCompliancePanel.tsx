
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TeamMemberWithProfile } from '@/types/team-management';

interface MemberCompliancePanelProps {
  members: TeamMemberWithProfile[];
}

export function MemberCompliancePanel({ members }: MemberCompliancePanelProps) {
  const membersWithCompliance = members.map(member => ({
    ...member,
    compliance: {
      status: 'compliant',
      score: 85,
      lastReview: new Date().toISOString()
    }
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {membersWithCompliance.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {member.profile?.display_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">{member.profile?.display_name || 'Unknown User'}</h4>
                  <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {member.compliance.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Score: {member.compliance.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
