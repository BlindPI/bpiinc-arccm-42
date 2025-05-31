
import { NavigateFunction } from 'react-router-dom';

export interface NavigationAction {
  path: string;
  label: string;
  description?: string;
  requiresAuth?: boolean;
  requiredRoles?: string[];
}

export interface RoleNavigationMap {
  [key: string]: NavigationAction[];
}

export class DashboardNavigationService {
  private static roleNavigationMap: RoleNavigationMap = {
    SA: [
      { path: '/user-management', label: 'User Management', description: 'Manage system users and permissions' },
      { path: '/system-settings', label: 'System Settings', description: 'Configure system-wide settings' },
      { path: '/analytics', label: 'Reports', description: 'View system analytics and reports' },
      { path: '/system-monitoring', label: 'System Monitoring', description: 'Monitor system health and performance' }
    ],
    AD: [
      { path: '/user-management', label: 'User Management', description: 'Manage organization users' },
      { path: '/certificates', label: 'Certifications', description: 'Manage certificates and compliance' },
      { path: '/compliance', label: 'Compliance', description: 'View compliance status and reports' },
      { path: '/organization-settings', label: 'Organization', description: 'Configure organization settings' }
    ],
    AP: [
      { path: '/courses', label: 'Schedule Course', description: 'Schedule and manage courses' },
      { path: '/team-management', label: 'Manage Team', description: 'Manage instructors and team members' },
      { path: '/certificates/create', label: 'Issue Certificate', description: 'Issue new certificates' },
      { path: '/analytics', label: 'View Reports', description: 'View provider analytics and reports' }
    ],
    IC: [
      { path: '/instructor/schedule', label: 'View Schedule', description: 'View your teaching schedule' },
      { path: '/certificates/create', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/instructor/hours', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/instructor/resources', label: 'Training Resources', description: 'Access training materials' }
    ],
    IP: [
      { path: '/instructor/schedule', label: 'View Schedule', description: 'View your teaching schedule' },
      { path: '/certificates/create', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/instructor/hours', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/instructor/resources', label: 'Training Resources', description: 'Access training materials' }
    ],
    IT: [
      { path: '/instructor/schedule', label: 'My Schedule', description: 'View your teaching schedule' },
      { path: '/certificates/create', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/instructor/hours', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/instructor/resources', label: 'Training Resources', description: 'Access training materials' }
    ],
    IN: [
      { path: '/courses/browse', label: 'Browse Courses', description: 'Find and enroll in courses' },
      { path: '/student/schedule', label: 'View Schedule', description: 'View your course schedule' },
      { path: '/certificates', label: 'My Certificates', description: 'View your certificates' },
      { path: '/student/goals', label: 'Learning Goals', description: 'Set and track learning goals' }
    ]
  };

  static getNavigationActionsForRole(role: string): NavigationAction[] {
    return this.roleNavigationMap[role] || this.roleNavigationMap['IN'];
  }

  static navigateWithTransition(
    navigate: NavigateFunction, 
    path: string, 
    options?: { state?: any; replace?: boolean }
  ): void {
    // Add transition class to body for smooth navigation
    document.body.classList.add('page-transitioning');
    
    setTimeout(() => {
      navigate(path, options);
      
      // Remove transition class after navigation
      setTimeout(() => {
        document.body.classList.remove('page-transitioning');
      }, 300);
    }, 100);
  }

  static createBreadcrumbTrail(currentPath: string, dashboardType?: 'role' | 'team'): Array<{ label: string; path: string }> {
    const breadcrumbs = [
      { label: 'Dashboard', path: '/' }
    ];

    if (dashboardType === 'team') {
      breadcrumbs.push({ label: 'Team Dashboard', path: '/' });
    }

    // Add current page breadcrumb based on path
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const pageLabel = this.getPageLabelFromPath(currentPath);
      breadcrumbs.push({ label: pageLabel, path: currentPath });
    }

    return breadcrumbs;
  }

  private static getPageLabelFromPath(path: string): string {
    const pathMap: { [key: string]: string } = {
      '/user-management': 'User Management',
      '/certificates': 'Certificates',
      '/courses': 'Courses',
      '/analytics': 'Analytics',
      '/instructor/schedule': 'My Schedule',
      '/student/schedule': 'My Schedule',
      '/system-settings': 'System Settings'
    };

    return pathMap[path] || 'Page';
  }
}
