
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileCheck, TrendingUp, Settings, AlertTriangle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import existing sophisticated compliance components
import { ComplianceManagement } from '@/components/compliance/ComplianceManagement';
import { ComplianceRequirementsManager } from '@/components/compliance/ComplianceRequirementsManager';
import { ComplianceDocumentManager } from '@/components/compliance/ComplianceDocumentManager';
import { ComplianceAuditTrail } from '@/components/compliance/ComplianceAuditTrail';
import { ComplianceReportsGenerator } from '@/components/compliance/ComplianceReportsGenerator';
import { ComplianceTierManagement } from '@/components/compliance/ComplianceTierManagement';
import { ComplianceWorkflowManager } from '@/components/compliance/ComplianceWorkflowManager';
import { ComplianceMetricsAnalytics } from '@/components/compliance/ComplianceMetricsAnalytics';
import { ComplianceNotificationCenter } from '@/components/compliance/ComplianceNotificationCenter';

// Import the updated components that handle real data
import { ComplianceTierDashboard } from '@/components/compliance/ComplianceTierDashboard';
import { RequirementReviewQueue } from '@/components/compliance/RequirementReviewQueue';
import { ComplianceTierManager } from '@/components/compliance/ComplianceTierManager';
import { TierComparisonChart } from '@/components/compliance/TierComparisonChart';
import { ComplianceTierRequirementsEditor } from '@/components/compliance/ComplianceTierRequirementsEditor';

export default function ComplianceAdminDashboard() {
  const { data: profile } = useProfile();

  // Check if user has SA/AD admin access
  const hasAdminAccess = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (!hasAdminAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You do not have permission to access the compliance administration dashboard.
                This area is restricted to System Administrators and Administrative users only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Compliance Administration
          </h1>
          <p className="text-muted-foreground">
            Enterprise compliance management and oversight dashboard
          </p>
        </div>
      </div>

      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <Shield className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-800 font-medium">
          Full Administrative Access - System-wide compliance management enabled
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="tiers">Tier Management</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ComplianceTierDashboard />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <ComplianceTierRequirementsEditor />
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ComplianceTierManager
              userId={profile?.id || ''}
              userRole={profile?.role as 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT'}
              userName={profile?.display_name || profile?.email || 'Administrator'}
              canManage={true}
            />
            <Card>
              <CardHeader>
                <CardTitle>Tier Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <TierComparisonChart
                  comparisonType="distribution"
                  role={profile?.role || 'SA'}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <RequirementReviewQueue />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <TierComparisonChart
              comparisonType="metrics"
              role={profile?.role || 'SA'}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                System-wide compliance document oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Document management interface will integrate with existing ComplianceDocumentManager component
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                System-wide compliance audit and activity log
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Audit trail interface will integrate with existing ComplianceAuditTrail component
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
