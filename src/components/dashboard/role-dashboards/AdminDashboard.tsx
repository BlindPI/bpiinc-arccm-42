import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Users, Award, ClipboardCheck, Loader2 } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/dashboard/useAdminDashboardData';

interface AdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const AdminDashboard = ({ config, profile }: AdminDashboardProps) => {
  const {
    metrics,
    pendingApprovals,
    complianceStatus,
    isLoading,
    error
  } = useAdminDashboardData();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200 shadow-sm">
        <AlertDescription className="text-red-800 font-medium">
          Error loading dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-indigo-50 to-white border-indigo-200 shadow-sm">
        <Building className="h-4 w-4 text-indigo-600 mr-2" />
        <AlertDescription className="text-indigo-800 font-medium">
          You are logged in as an Administrator
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Organization Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.organizationUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active users in your organization
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCertifications || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Valid certifications
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.expiringSoon || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Certifications expiring in 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.complianceIssues || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {pendingApprovals && pendingApprovals.length > 0 ? (
                pendingApprovals.map(approval => (
                  <div key={approval.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-amber-800 font-medium">{approval.type}</span>
                    <button className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200">
                      Review
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-500">No pending approvals</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {complianceStatus && complianceStatus.length > 0 ? (
                complianceStatus.map(status => {
                  const bgColor = status.status === 'compliant'
                    ? 'bg-green-50'
                    : status.status === 'warning'
                      ? 'bg-amber-50'
                      : 'bg-red-50';
                  
                  const borderColor = status.status === 'compliant'
                    ? 'border-green-100'
                    : status.status === 'warning'
                      ? 'border-amber-100'
                      : 'border-red-100';
                  
                  const textColor = status.status === 'compliant'
                    ? 'text-green-800'
                    : status.status === 'warning'
                      ? 'text-amber-800'
                      : 'text-red-800';
                  
                  const badgeBg = status.status === 'compliant'
                    ? 'bg-green-100'
                    : status.status === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-red-100';
                  
                  return (
                    <div key={status.id} className={`flex justify-between items-center p-3 ${bgColor} rounded-lg border ${borderColor}`}>
                      <span className={textColor}>{status.name}</span>
                      <span className={`px-3 py-1 ${badgeBg} ${textColor} rounded-md text-sm`}>
                        {status.complianceRate}% Compliant
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-500">No compliance data available</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Users className="h-6 w-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-indigo-800">Manage Users</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Award className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800">Certifications</span>
            </button>
            <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <ClipboardCheck className="h-6 w-6 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-800">Compliance</span>
            </button>
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Building className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-800">Organization</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;