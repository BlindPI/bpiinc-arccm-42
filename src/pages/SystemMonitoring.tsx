
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealthDashboard } from '@/components/monitoring/SystemHealthDashboard';
import { MaintenanceMode } from '@/components/maintenance/MaintenanceMode';
import { BackupManagement } from '@/components/backup/BackupManagement';
import { AuditTrailDashboard } from '@/components/audit/AuditTrailDashboard';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function SystemMonitoring() {
  const { data: profile } = useProfile();

  const canAccessMonitoring = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (!canAccessMonitoring) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only System Administrators and Administrators can access system monitoring tools.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceMode />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditTrailDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
