
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
      { path: '/users', label: 'User Management', description: 'Manage system users and permissions' },
      { path: '/settings', label: 'System Settings', description: 'Configure system-wide settings' },
      { path: '/analytics', label: 'Reports', description: 'View system analytics and reports' },
      { path: '/system-monitoring', label: 'System Monitoring', description: 'Monitor system health and performance' }
    ],
    AD: [
      { path: '/users', label: 'User Management', description: 'Manage organization users' },
      { path: '/certificates', label: 'Certifications', description: 'Manage certificates and compliance' },
      { path: '/compliance', label: 'Compliance', description: 'View compliance status and reports' },
      { path: '/settings', label: 'Organization', description: 'Configure organization settings' }
    ],
    AP: [
      { path: '/courses', label: 'Schedule Course', description: 'Schedule and manage courses' },
      { path: '/teams', label: 'Manage Team', description: 'Manage instructors and team members' },
      { path: '/certificates', label: 'Issue Certificate', description: 'Issue new certificates' },
      { path: '/analytics', label: 'View Reports', description: 'View provider analytics and reports' }
    ],
    IC: [
      { path: '/courses', label: 'View Schedule', description: 'View your teaching schedule' },
      { path: '/certificates', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/teaching-sessions', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/courses', label: 'Training Resources', description: 'Access training materials' }
    ],
    IP: [
      { path: '/courses', label: 'View Schedule', description: 'View your teaching schedule' },
      { path: '/certificates', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/teaching-sessions', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/courses', label: 'Training Resources', description: 'Access training materials' }
    ],
    IT: [
      { path: '/courses', label: 'My Schedule', description: 'View your teaching schedule' },
      { path: '/certificates', label: 'Issue Certificate', description: 'Issue certificates to students' },
      { path: '/teaching-sessions', label: 'Log Hours', description: 'Log your teaching hours' },
      { path: '/courses', label: 'Training Resources', description: 'Access training materials' }
    ],
    IN: [
      { path: '/courses', label: 'Browse Courses', description: 'Find and enroll in courses' },
      { path: '/enrollments', label: 'View Schedule', description: 'View your course schedule' },
      { path: '/certificates', label: 'My Certificates', description: 'View your certificates' },
      { path: '/profile', label: 'Learning Goals', description: 'Set and track learning goals' }
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
