
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings,
  Download,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface UserManagementMetricsHeaderProps {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  complianceRate: number;
  recentActivity: number;
  onInviteUser?: () => void;
  onExport?: () => void;
}

export const UserManagementMetricsHeader: React.FC<UserManagementMetricsHeaderProps> = ({
  totalUsers,
  activeUsers,
  pendingUsers,
  complianceRate,
  recentActivity,
  onInviteUser,
  onExport
}) => {
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getComplianceBadgeVariant = (rate: number) => {
    if (rate >= 80) return 'default';
    if (rate >= 60) return 'secondary';
    return 'destructive';
  };

  const metrics = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      description: 'All registered users',
      trend: '+12% this month'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Currently active',
      trend: `${Math.round((activeUsers / totalUsers) * 100)}% of total`
    },
    {
      title: 'Compliance Rate',
      value: `${complianceRate}%`,
      icon: Shield,
      color: getComplianceColor(complianceRate),
      description: 'User compliance',
      trend: complianceRate >= 80 ? 'Excellent' : 'Needs attention'
    },
    {
      title: 'Recent Activity',
      value: recentActivity,
      icon: Activity,
      color: 'text-purple-600',
      description: 'Actions this week',
      trend: 'Active community'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalUsers} Total Users
            </Badge>
            {complianceRate >= 80 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                High Compliance
              </Badge>
            )}
            {complianceRate < 80 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Compliance Alert
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Manage users, assign roles, and track compliance across your organization
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button className="gap-2" onClick={onInviteUser}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-50">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {metric.trend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
