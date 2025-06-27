import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileCheck, TrendingUp } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Import REAL enterprise compliance components
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Compliance Administration
          </h2>
          <p className="text-muted-foreground">
            System-wide compliance management and oversight dashboard
          </p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground">
              Total active users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground">
              Submissions awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Distribution</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground">
              Basic vs Robust tier ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-xs text-muted-foreground">
              Compliance system status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content - Using REAL Enterprise Components */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* System-wide Compliance Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                System-wide Compliance Dashboard
              </CardTitle>
              <CardDescription>
                Overview of all users, tiers, and compliance status across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceTierDashboard />
            </CardContent>
          </Card>
        </div>

        {/* Requirement Review Queue */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Submission Review Queue
              </CardTitle>
              <CardDescription>
                Review and approve pending compliance submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementReviewQueue />
            </CardContent>
          </Card>
        </div>

        {/* Tier Management Interface */}
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
                userRole={profile?.role === 'SA' || profile?.role === 'AD' ? 'AP' : profile?.role as 'AP' | 'IC' | 'IP' | 'IT' || 'AP'}
                userName={profile?.display_name || profile?.email || 'Administrator'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Performance Charts */}
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
                data={[]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}