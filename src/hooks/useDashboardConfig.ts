import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { UserRole } from '@/types/auth';

export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  width?: 'full' | 'half' | 'third';
  priority: number;
  permissions?: UserRole[];
}

export interface DashboardConfig {
  welcomeMessage: string;
  subtitle: string;
  widgets: DashboardWidgetConfig[];
}

/**
 * Hook to get dashboard configuration based on user role
 */
export const useDashboardConfig = (): {
  config: DashboardConfig;
  isLoading: boolean;
} => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  const config = useMemo(() => {
    const role = profile?.role || 'IT';
    
    // Default welcome message
    let welcomeMessage = 'Welcome to your dashboard';
    let subtitle = 'Manage your certification compliance';
    
    // Role-specific welcome messages
    if (role === 'SA') {
      welcomeMessage = 'System Administration Dashboard';
      subtitle = 'Manage system-wide settings and users';
    } else if (role === 'AD') {
      welcomeMessage = 'Administration Dashboard';
      subtitle = 'Manage your organization and users';
    } else if (role === 'AP') {
      welcomeMessage = 'Provider Dashboard';
      subtitle = 'Manage your instructors and courses';
    } else if (['IC', 'IP', 'IT'].includes(role)) {
      welcomeMessage = 'Instructor Dashboard';
      subtitle = 'Manage your courses and certifications';
    }

    // Base widgets that everyone can see
    const baseWidgets: DashboardWidgetConfig[] = [
      {
        id: 'profile',
        type: 'profile',
        title: 'Profile Overview',
        width: 'full',
        priority: 10
      },
      {
        id: 'notifications',
        type: 'notifications',
        title: 'Recent Notifications',
        width: 'half',
        priority: 20
      }
    ];

    // System Admin widgets
    const systemAdminWidgets: DashboardWidgetConfig[] = [
      {
        id: 'system-metrics',
        type: 'metrics',
        title: 'System Metrics',
        width: 'full',
        priority: 5,
        permissions: ['SA']
      },
      {
        id: 'user-management',
        type: 'user-management',
        title: 'User Management',
        width: 'half',
        priority: 15,
        permissions: ['SA']
      },
      {
        id: 'system-logs',
        type: 'logs',
        title: 'System Logs',
        width: 'half',
        priority: 25,
        permissions: ['SA']
      }
    ];

    // Administrator widgets
    const adminWidgets: DashboardWidgetConfig[] = [
      {
        id: 'org-metrics',
        type: 'metrics',
        title: 'Organization Metrics',
        width: 'full',
        priority: 5,
        permissions: ['SA', 'AD']
      },
      {
        id: 'org-user-management',
        type: 'user-management',
        title: 'User Management',
        width: 'half',
        priority: 15,
        permissions: ['SA', 'AD']
      },
      {
        id: 'approval-queue',
        type: 'approval-queue',
        title: 'Approval Queue',
        width: 'half',
        priority: 25,
        permissions: ['SA', 'AD']
      }
    ];

    // Provider widgets
    const providerWidgets: DashboardWidgetConfig[] = [
      {
        id: 'provider-metrics',
        type: 'metrics',
        title: 'Provider Metrics',
        width: 'full',
        priority: 5,
        permissions: ['SA', 'AD', 'AP']
      },
      {
        id: 'instructor-management',
        type: 'instructor-management',
        title: 'Instructor Management',
        width: 'half',
        priority: 15,
        permissions: ['SA', 'AD', 'AP']
      },
      {
        id: 'course-schedule',
        type: 'course-schedule',
        title: 'Course Schedule',
        width: 'half',
        priority: 25,
        permissions: ['SA', 'AD', 'AP']
      }
    ];

    // Instructor widgets
    const instructorWidgets: DashboardWidgetConfig[] = [
      {
        id: 'teaching-schedule',
        type: 'teaching-schedule',
        title: 'Teaching Schedule',
        width: 'half',
        priority: 5,
        permissions: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
      },
      {
        id: 'certification-status',
        type: 'certification-status',
        title: 'Certification Status',
        width: 'half',
        priority: 15,
        permissions: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
      },
      {
        id: 'progression-path',
        type: 'progression-path',
        title: 'Progression Path',
        width: 'full',
        priority: 25,
        permissions: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
      }
    ];

    // Combine all widgets
    let allWidgets = [...baseWidgets];

    // Add role-specific widgets
    if (role === 'SA') {
      allWidgets = [...allWidgets, ...systemAdminWidgets, ...adminWidgets, ...providerWidgets, ...instructorWidgets];
    } else if (role === 'AD') {
      allWidgets = [...allWidgets, ...adminWidgets, ...providerWidgets, ...instructorWidgets];
    } else if (role === 'AP') {
      allWidgets = [...allWidgets, ...providerWidgets, ...instructorWidgets];
    } else if (['IC', 'IP', 'IT'].includes(role)) {
      allWidgets = [...allWidgets, ...instructorWidgets];
    }

    // Filter widgets by permissions
    const filteredWidgets = allWidgets.filter(widget => {
      if (!widget.permissions) return true;
      return widget.permissions.includes(role as UserRole);
    });

    // Sort widgets by priority
    const sortedWidgets = filteredWidgets.sort((a, b) => a.priority - b.priority);

    return {
      welcomeMessage,
      subtitle,
      widgets: sortedWidgets
    };
  }, [profile?.role]);

  return { config, isLoading };
};