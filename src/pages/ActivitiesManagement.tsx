
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';

export default function ActivitiesManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities Management</h1>
          <p className="text-muted-foreground">
            Track tasks, calls, meetings, and other customer interactions with comprehensive activity management
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
          <CardDescription>
            Manage your tasks, calls, meetings, and follow-ups with due date tracking and status management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivitiesTable />
        </CardContent>
      </Card>
    </div>
  );
}
