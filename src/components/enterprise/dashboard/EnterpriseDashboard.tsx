
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { DataService } from '@/services/dataService';
import { MetricWidget } from '../widgets/MetricWidget';
import { DataTableWidget } from '../widgets/DataTableWidget';
import { Users, Award, Clock, Shield } from 'lucide-react';

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

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.display_name || 'User'}
        </h1>
        <p className="text-blue-100">
          Here's what's happening with your training programs today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          status="healthy"
        />
        <MetricWidget
          title="Active Certifications"
          value={metrics?.activeCertifications || 0}
          icon={Award}
          trend={{ value: 8, isPositive: true }}
          status="healthy"
        />
        <MetricWidget
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          icon={Clock}
          status={metrics?.pendingApprovals ? (metrics.pendingApprovals > 10 ? 'warning' : 'healthy') : 'healthy'}
        />
        <MetricWidget
          title="System Health"
          value={`${metrics?.systemHealth.healthy || 0}/3`}
          icon={Shield}
          status="healthy"
        />
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DataTableWidget
          title="Recent Certificates"
          data={certificates?.slice(0, 5) || []}
          columns={[
            { key: 'recipient_name', title: 'Recipient' },
            { key: 'course_name', title: 'Course' },
            { 
              key: 'status', 
              title: 'Status',
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {value}
                </span>
              )
            }
          ]}
        />

        <DataTableWidget
          title="Recent Users"
          data={users?.slice(0, 5) || []}
          columns={[
            { key: 'display_name', title: 'Name' },
            { key: 'role', title: 'Role' },
            { 
              key: 'status', 
              title: 'Status',
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {value}
                </span>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
