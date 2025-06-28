
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardHeader, CardBody } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { LayoutDashboard, Users, GraduationCap, BarChart3 } from 'lucide-react';
import type { UserRole } from '@/types/foundation';

interface DashboardMetric {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
}

interface RoleDashboardProps {
  role: UserRole;
  metrics: DashboardMetric[];
  quickActions?: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
  }>;
}

function RoleDashboard({ role, metrics, quickActions }: RoleDashboardProps) {
  const roleLabels = {
    SA: 'System Administrator',
    AD: 'Administrator', 
    AP: 'Authorized Provider',
    IC: 'Instructor Candidate',
    IP: 'Instructor Pending',
    IT: 'Instructor Trainer',
    IN: 'Instructor'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {roleLabels[role]}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    {metric.trend && (
                      <p className="text-xs text-green-600">{metric.trend}</p>
                    )}
                  </div>
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="p-4 h-auto justify-start"
                    onClick={() => window.location.href = action.href}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export function DashboardFoundation() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Unable to load profile</p>
        </div>
      </div>
    );
  }

  // Default metrics for all roles
  const defaultMetrics: DashboardMetric[] = [
    {
      title: 'Active Teams',
      value: '12',
      icon: Users,
      trend: '+2 this month'
    },
    {
      title: 'Certificates',
      value: '156',
      icon: GraduationCap,
      trend: '+24 this week'
    },
    {
      title: 'Compliance Rate',
      value: '94%',
      icon: BarChart3,
      trend: '+3% improvement'
    },
    {
      title: 'Dashboard Views',
      value: '1,234',
      icon: LayoutDashboard,
      trend: 'This month'
    }
  ];

  const quickActions = [
    {
      title: 'Create Certificate',
      description: 'Issue a new training certificate',
      href: '/certificates',
      icon: GraduationCap
    },
    {
      title: 'Manage Teams',
      description: 'View and organize your teams',
      href: '/teams',
      icon: Users
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      href: '/analytics',
      icon: BarChart3
    },
    {
      title: 'System Settings',
      description: 'Configure your preferences',
      href: '/settings',
      icon: LayoutDashboard
    }
  ];

  return (
    <RoleDashboard 
      role={profile.role}
      metrics={defaultMetrics}
      quickActions={quickActions}
    />
  );
}
