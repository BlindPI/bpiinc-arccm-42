
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileCheck, TrendingUp } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Import REAL enterprise compliance components with proper data integration
import { ComplianceTierDashboard } from '@/components/compliance/ComplianceTierDashboard';
import { RequirementReviewQueue } from '@/components/compliance/RequirementReviewQueue';
import { ComplianceTierManager } from '@/components/compliance/ComplianceTierManager';
import { TierComparisonChart } from '@/components/compliance/TierComparisonChart';

export default function ComplianceAdminDashboard() {
  const { data: profile } = useProfile();

  // Check if user has admin access (SA/AD)
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
            System-wide compliance management and oversight dashboard
          </p>
        </div>
      </div>

      {/* System-wide Compliance Overview - Now uses real data */}
      <div className="lg:col-span-2">
        <ComplianceTierDashboard />
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Requirement Review Queue - Now properly loads submissions */}
        <div>
          <RequirementReviewQueue />
        </div>

        {/* Tier Management Interface - Now recognizes SA/AD roles */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Tier Management
              </CardTitle>
              <CardDescription>
                Manage user tiers and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceTierManager
                userId={profile?.id || ''}
                userRole={profile?.role as 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT'}
                userName={profile?.display_name || profile?.email || 'Administrator'}
                canManage={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Performance Charts - Now shows real data */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compliance Analytics & Performance
              </CardTitle>
              <CardDescription>
                System-wide compliance metrics and tier comparison analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TierComparisonChart
                comparisonType="distribution"
                role={profile?.role || 'SA'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
