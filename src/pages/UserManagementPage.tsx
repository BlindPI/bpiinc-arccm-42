
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function UserManagementPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              User Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>User management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
