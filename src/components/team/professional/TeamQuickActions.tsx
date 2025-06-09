
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMemberWithProfile } from '@/types/team-management';

interface TeamQuickActionsProps {
  members: TeamMemberWithProfile[];
  onAction: (action: string, data?: any) => void;
}

export function TeamQuickActions({ members, onAction }: TeamQuickActionsProps) {
  const recentMembers = members.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Members</h4>
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span>{member.profile?.display_name || 'Unknown User'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction('view-member', member.id)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onAction('add-member')}
            >
              Add New Member
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onAction('export-data')}
            >
              Export Team Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
