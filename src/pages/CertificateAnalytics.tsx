
import React from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartBar } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/certificates/analytics/AnalyticsDashboard';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function CertificateAnalyticsPage() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Only allow admins to access this page
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to view analytics. Only administrators can access this page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <PageHeader
          icon={<ChartBar className="h-7 w-7 text-primary" />}
          title="Certificate Analytics"
          subtitle="Comprehensive dashboard for certificate usage and distribution metrics"
          badge={{
            text: "Admin Feature",
            variant: "success"
          }}
        />
        
        <div className="bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border rounded-xl shadow-sm p-6 w-full">
          <AnalyticsDashboard />
        </div>
      </div>
    </DashboardLayout>
  );
}
