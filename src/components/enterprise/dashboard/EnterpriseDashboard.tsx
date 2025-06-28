
import React from 'react';
import { Container } from '@/design-system/layout/Container';
import { FlexLayout } from '@/design-system/layout/FlexLayout';
import { CardLayout } from '@/design-system/components/molecules/CardLayout';
import { NavigationBreadcrumb } from '@/design-system/components/molecules/NavigationBreadcrumb';
import { DashboardGrid } from './DashboardGrid';
import { useProfile } from '@/hooks/useProfile';

export function EnterpriseDashboard() {
  const { data: profile } = useProfile();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' }
  ];

  return (
    <Container size="full" padding="lg">
      <FlexLayout direction="col" gap="lg">
        {/* Header Section */}
        <FlexLayout direction="col" gap="sm">
          <NavigationBreadcrumb items={breadcrumbItems} />
          <FlexLayout direction="row" justify="between" align="center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Enterprise Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back{profile?.displayName ? `, ${profile.displayName}` : ''}! 
                Here's what's happening in your organization.
              </p>
            </div>
          </FlexLayout>
        </FlexLayout>

        {/* Main Dashboard Content */}
        <DashboardGrid userRole={profile?.role} />

        {/* Quick Actions Section */}
        <CardLayout className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <FlexLayout direction="row" gap="base" wrap>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Create Certificate
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Manage Users
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              View Analytics
            </button>
          </FlexLayout>
        </CardLayout>

        {/* Recent Activity Section */}
        <CardLayout className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Certificate issued', user: 'John Doe', time: '2 hours ago' },
              { action: 'New user registered', user: 'Jane Smith', time: '4 hours ago' },
              { action: 'Course completed', user: 'Mike Johnson', time: '6 hours ago' },
              { action: 'Report generated', user: 'Admin', time: '1 day ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardLayout>
      </FlexLayout>
    </Container>
  );
}
