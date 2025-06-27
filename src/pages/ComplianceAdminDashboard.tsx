
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileCheck, TrendingUp, Settings, AlertTriangle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import real compliance components
import { ComplianceTierDashboard } from '@/components/compliance/ComplianceTierDashboard';
import { RequirementReviewQueue } from '@/components/compliance/RequirementReviewQueue';
import { ComplianceTierRequirementsEditor } from '@/components/compliance/ComplianceTierRequirementsEditor';
import { AdminUserTierManager } from '@/components/compliance/AdminUserTierManager';
import { RealComplianceAnalytics } from '@/components/compliance/RealComplianceAnalytics';
import { ComplianceDocumentManager } from '@/components/compliance/ComplianceDocumentManager';
import { ComplianceAuditTrail } from '@/components/compliance/ComplianceAuditTrail';

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
          <AdminUserTierManager />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <RequirementReviewQueue />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RealComplianceAnalytics />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Document Management System
              </CardTitle>
              <CardDescription>
                System-wide compliance document oversight and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceDocumentManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compliance Audit Trail
              </CardTitle>
              <CardDescription>
                System-wide compliance audit and activity monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceAuditTrail />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
