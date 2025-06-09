
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamAnalyticsDashboard } from './analytics/TeamAnalyticsDashboard';
import { EnhancedTeamManagementHub } from './enhanced/EnhancedTeamManagementHub';
import { AdminTeamManagement } from './admin/AdminTeamManagement';
// Removed broken import

export function RealEnterpriseTeamHub() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedTeamManagementHub />
            <TeamAnalyticsDashboard />
          </div>
          <div className="mt-6">
            <AdminTeamManagement />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
