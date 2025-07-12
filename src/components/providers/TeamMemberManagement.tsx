import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamMemberManagementProps {
  teamId: string;
  teamName?: string;
  providerId?: string;
  onClose?: () => void;
}

export default function TeamMemberManagement({ teamId, teamName, providerId, onClose }: TeamMemberManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Member Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Team member management for team: {teamName || teamId}</p>
        {providerId && <p className="text-sm text-muted-foreground">Provider: {providerId}</p>}
      </CardContent>
    </Card>
  );
}