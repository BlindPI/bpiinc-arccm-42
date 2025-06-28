
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { DataService } from '@/services/dataService';
import { Users, Award, Clock, Shield, TrendingUp } from 'lucide-react';

// Import our new design system components
import { 
  CardLayout, 
  StatusIndicator, 
  EnhancedButton,
  SearchComponent,
  NavigationBreadcrumb,
  Skeleton,
  getRoleTheme 
} from '@/design-system';

export function EnterpriseDashboard() {
  const { data: profile } = useProfile();
  
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', profile?.role],
    queryFn: () => DataService.getDashboardMetrics(profile?.role || ''),
    enabled: !!profile?.role
  });

  const { data: certificates } = useQuery({
    queryKey: ['recent-certificates'],
    queryFn: DataService.getCertificates
  });

  const { data: users } = useQuery({
    queryKey: ['recent-users'],
    queryFn: DataService.getUsers
  });

  // Get role-based theme
  const roleTheme = getRoleTheme(profile?.role || 'ST');

  if (metricsLoading) {
    return (
      <div className="space-y-8">
        {/* Loading State with our new Skeleton component */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8">
          <Skeleton height={36} width={300} className="mb-4 bg-blue-400/30" />
          <Skeleton height={20} width={400} className="bg-blue-400/20" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
              <Skeleton height={24} width={120} className="mb-4" />
              <Skeleton height={48} width={80} className="mb-2" />
              <Skeleton height={16} width={150} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', current: true }
  ];

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <NavigationBreadcrumb items={breadcrumbItems} />

      {/* Welcome Section with Role-based Styling */}
      <div 
        className="rounded-lg p-8 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${roleTheme.primary}, ${roleTheme.primary}CC)` 
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.display_name || 'User'}
            </h1>
            <p className="text-white/90 text-lg">
              Here's what's happening with your training programs today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator 
              status="success" 
              showText 
              text={`${profile?.role} Access`}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between">
        <SearchComponent 
          placeholder="Search across all modules..."
          onSearch={(query) => console.log('Search:', query)}
        />
        <div className="flex gap-3">
          <EnhancedButton 
            variant="primary" 
            icon={TrendingUp}
            size="base"
          >
            View Reports
          </EnhancedButton>
          <EnhancedButton 
            variant="secondary"
            size="base"
          >
            Quick Actions
          </EnhancedButton>
        </div>
      </div>

      {/* Metrics Grid using CardLayout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardLayout 
          title="Total Users"
          padding="lg"
          shadow="base"
          className="border-l-4 border-l-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metrics?.totalUsers || 0}
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status="success" size="sm" />
                <span className="text-sm text-green-600">+12% from last month</span>
              </div>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </CardLayout>

        <CardLayout 
          title="Active Certifications"
          padding="lg"
          shadow="base"
          className="border-l-4 border-l-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metrics?.activeCertifications || 0}
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status="success" size="sm" />
                <span className="text-sm text-green-600">+8% from last month</span>
              </div>
            </div>
            <Award className="h-12 w-12 text-green-500" />
          </div>
        </CardLayout>

        <CardLayout 
          title="Pending Approvals"
          padding="lg"
          shadow="base"
          className="border-l-4 border-l-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metrics?.pendingApprovals || 0}
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator 
                  status={metrics?.pendingApprovals && metrics.pendingApprovals > 10 ? "warning" : "neutral"} 
                  size="sm" 
                />
                <span className="text-sm text-gray-600">Requires attention</span>
              </div>
            </div>
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </CardLayout>

        <CardLayout 
          title="System Health"
          padding="lg"
          shadow="base"
          className="border-l-4 border-l-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metrics?.systemHealth.healthy || 0}/3
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status="success" size="sm" />
                <span className="text-sm text-green-600">All systems operational</span>
              </div>
            </div>
            <Shield className="h-12 w-12 text-purple-500" />
          </div>
        </CardLayout>
      </div>

      {/* Data Tables using CardLayout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardLayout
          title="Recent Certificates"
          subtitle="Latest certificate activities"
          actions={
            <EnhancedButton variant="ghost" size="sm">
              View All
            </EnhancedButton>
          }
        >
          <div className="space-y-4">
            {certificates?.slice(0, 5).map((cert, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{cert.recipient_name}</div>
                  <div className="text-sm text-gray-500">{cert.course_name}</div>
                </div>
                <StatusIndicator 
                  status={cert.status === 'ACTIVE' ? 'success' : 'neutral'}
                  showText
                  text={cert.status}
                  size="sm"
                />
              </div>
            ))}
            {(!certificates || certificates.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No certificates found
              </div>
            )}
          </div>
        </CardLayout>

        <CardLayout
          title="Recent Users"
          subtitle="New user registrations"
          actions={
            <EnhancedButton variant="ghost" size="sm">
              View All
            </EnhancedButton>
          }
        >
          <div className="space-y-4">
            {users?.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{user.display_name || 'Unknown User'}</div>
                  <div className="text-sm text-gray-500">{user.role}</div>
                </div>
                <StatusIndicator 
                  status={user.status === 'ACTIVE' ? 'success' : 'neutral'}
                  showText
                  text={user.status}
                  size="sm"
                />
              </div>
            ))}
            {(!users || users.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </CardLayout>
      </div>
    </div>
  );
}
