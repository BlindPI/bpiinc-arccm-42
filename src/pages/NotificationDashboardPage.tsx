import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Bell } from 'lucide-react';
import { NotificationDashboard } from '@/components/notifications/NotificationDashboard';

export default function NotificationDashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader
          icon={<Bell className="h-7 w-7 text-primary" />}
          title="Notification Management"
          subtitle="Monitor and manage system notifications"
        />
        
        <NotificationDashboard />
      </div>
    </DashboardLayout>
  );
}