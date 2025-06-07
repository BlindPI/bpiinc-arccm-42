
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Award, 
  BarChart3,
  BookOpen,
  Settings,
  Plus,
  FileText,
  Bell,
  Target,
  TrendingUp
} from 'lucide-react';

interface TeamActionWorkflowsProps {
  teamRole: 'ADMIN' | 'MEMBER';
  teamPermissions: {
    canScheduleCourses: boolean;
    canManageMembers: boolean;
    canIssueCertificates: boolean;
    canViewReports: boolean;
    canModifySettings: boolean;
  };
  onActionClick: (action: string) => void;
}

export function TeamActionWorkflows({ 
  teamRole, 
  teamPermissions, 
  onActionClick 
}: TeamActionWorkflowsProps) {
  const [activeCategory, setActiveCategory] = useState<'primary' | 'management' | 'analytics'>('primary');

  const primaryActions = [
    {
      icon: Calendar,
      title: 'Schedule Course',
      description: 'Create new course sessions',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
      iconColor: 'text-blue-600',
      action: 'schedule-course',
      permission: teamPermissions.canScheduleCourses,
      badge: 'Quick Action'
    },
    {
      icon: Users,
      title: 'Manage Team',
      description: 'Add, remove, or modify team members',
      color: 'bg-green-50 hover:bg-green-100 text-green-700',
      iconColor: 'text-green-600',
      action: 'manage-team',
      permission: teamPermissions.canManageMembers,
      badge: teamRole === 'ADMIN' ? 'Admin Only' : null
    },
    {
      icon: Award,
      title: 'Issue Certificate',
      description: 'Generate certificates for completions',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
      iconColor: 'text-purple-600',
      action: 'issue-certificate',
      permission: teamPermissions.canIssueCertificates,
      badge: 'Certification'
    },
    {
      icon: BarChart3,
      title: 'View Reports',
      description: 'Access team analytics and reports',
      color: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
      iconColor: 'text-amber-600',
      action: 'view-reports',
      permission: teamPermissions.canViewReports,
      badge: 'Analytics'
    }
  ];

  const managementActions = [
    {
      icon: Settings,
      title: 'Team Settings',
      description: 'Configure team preferences and policies',
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
      iconColor: 'text-gray-600',
      action: 'team-settings',
      permission: teamPermissions.canModifySettings,
      badge: teamRole === 'ADMIN' ? 'Admin Only' : null
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Manage team documents and resources',
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
      iconColor: 'text-indigo-600',
      action: 'documentation',
      permission: true,
      badge: 'Resources'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure team notification preferences',
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700',
      iconColor: 'text-orange-600',
      action: 'notifications',
      permission: teamPermissions.canModifySettings,
      badge: 'Settings'
    },
    {
      icon: Target,
      title: 'Team Goals',
      description: 'Set and track team objectives',
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700',
      iconColor: 'text-teal-600',
      action: 'team-goals',
      permission: teamRole === 'ADMIN',
      badge: 'Goals'
    }
  ];

  const analyticsActions = [
    {
      icon: TrendingUp,
      title: 'Performance Trends',
      description: 'Detailed performance analytics',
      color: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
      iconColor: 'text-rose-600',
      action: 'performance-trends',
      permission: teamPermissions.canViewReports,
      badge: 'Trends'
    },
    {
      icon: Users,
      title: 'Member Analytics',
      description: 'Individual team member insights',
      color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700',
      iconColor: 'text-cyan-600',
      action: 'member-analytics',
      permission: teamRole === 'ADMIN',
      badge: 'Member Data'
    },
    {
      icon: BookOpen,
      title: 'Course Analytics',
      description: 'Course performance and engagement',
      color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
      iconColor: 'text-emerald-600',
      action: 'course-analytics',
      permission: teamPermissions.canViewReports,
      badge: 'Courses'
    },
    {
      icon: Award,
      title: 'Certification Reports',
      description: 'Certificate issuance and compliance',
      color: 'bg-violet-50 hover:bg-violet-100 text-violet-700',
      iconColor: 'text-violet-600',
      action: 'certification-reports',
      permission: teamPermissions.canViewReports,
      badge: 'Compliance'
    }
  ];

  const getActionsForCategory = () => {
    switch (activeCategory) {
      case 'primary':
        return primaryActions;
      case 'management':
        return managementActions;
      case 'analytics':
        return analyticsActions;
      default:
        return primaryActions;
    }
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'primary':
        return 'Quick Actions';
      case 'management':
        return 'Team Management';
      case 'analytics':
        return 'Analytics & Reporting';
      default:
        return 'Actions';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {getCategoryTitle()}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={activeCategory === 'primary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('primary')}
            >
              Quick
            </Button>
            <Button
              variant={activeCategory === 'management' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('management')}
            >
              Manage
            </Button>
            <Button
              variant={activeCategory === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('analytics')}
            >
              Analytics
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getActionsForCategory()
            .filter(action => action.permission)
            .map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={`h-auto p-4 flex flex-col items-center justify-center space-y-2 ${action.color} transition-all duration-200 hover:scale-105`}
                  onClick={() => onActionClick(action.action)}
                >
                  <div className="relative">
                    <IconComponent className={`h-6 w-6 ${action.iconColor}`} />
                    {action.badge && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 text-xs px-1 py-0 min-w-0"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </Button>
              );
            })}
        </div>

        {getActionsForCategory().filter(action => !action.permission).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Restricted Actions (insufficient permissions):</p>
            <div className="flex flex-wrap gap-2">
              {getActionsForCategory()
                .filter(action => !action.permission)
                .map((action, index) => (
                  <Badge key={index} variant="outline" className="opacity-50">
                    {action.title}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
