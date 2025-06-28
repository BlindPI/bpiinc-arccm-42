
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  FileText,
  BarChart3,
  Settings,
  Building2,
  Shield,
  Bell,
  Zap,
  UserCheck,
  MapPin,
  BookOpen,
  Calendar,
  Target,
  Briefcase,
  Monitor,
  Database
} from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { collapsed } = useSidebar();
  const { visibleGroups } = useNavigationVisibility();

  const navigationGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      items: [
        { 
          id: 'main-dashboard',
          name: 'Dashboard', 
          href: '/', 
          icon: LayoutDashboard,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'S']
        }
      ]
    },
    {
      id: 'provider-compliance',
      label: 'Provider & Compliance Management',
      items: [
        { 
          id: 'provider-management',
          name: 'Provider Management', 
          href: '/provider-management', 
          icon: Building2,
          roles: ['SA', 'AD']
        },
        { 
          id: 'authorized-providers',
          name: 'Authorized Providers', 
          href: '/authorized-providers', 
          icon: UserCheck,
          roles: ['SA', 'AD', 'AP']
        },
        { 
          id: 'compliance-admin',
          name: 'Compliance Dashboard', 
          href: '/compliance-admin', 
          icon: Shield,
          roles: ['SA', 'AD', 'AP'],
          enterprise: true
        }
      ]
    },
    {
      id: 'user-management',
      label: 'User Management',
      items: [
        { 
          id: 'users',
          name: 'Users', 
          href: '/users', 
          icon: Users,
          roles: ['SA', 'AD', 'AP']
        },
        { 
          id: 'teams',
          name: 'Teams', 
          href: '/teams', 
          icon: Users,
          roles: ['SA', 'AD', 'AP']
        },
        { 
          id: 'locations',
          name: 'Locations', 
          href: '/locations', 
          icon: MapPin,
          roles: ['SA', 'AD', 'AP']
        }
      ]
    },
    {
      id: 'training-education',
      label: 'Training & Education',
      items: [
        { 
          id: 'courses',
          name: 'Courses', 
          href: '/courses', 
          icon: BookOpen,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
        },
        { 
          id: 'certificates',
          name: 'Certificates', 
          href: '/certificates', 
          icon: Award,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
        },
        { 
          id: 'enrollments',
          name: 'Enrollments', 
          href: '/enrollments', 
          icon: GraduationCap,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'S']
        },
        { 
          id: 'role-management',
          name: 'Role Management', 
          href: '/role-management', 
          icon: UserCheck,
          roles: ['SA', 'AD', 'IC', 'IP', 'IT']
        }
      ]
    },
    {
      id: 'compliance-automation',
      label: 'Compliance & Automation',
      items: [
        { 
          id: 'compliance',
          name: 'Compliance', 
          href: '/compliance', 
          icon: FileText,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'S']
        },
        { 
          id: 'automation',
          name: 'Automation', 
          href: '/automation', 
          icon: Zap,
          roles: ['SA', 'AD'],
          enterprise: true
        },
        { 
          id: 'notifications',
          name: 'Notifications', 
          href: '/notifications', 
          icon: Bell,
          roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'S']
        }
      ]
    },
    {
      id: 'analytics-reporting',
      label: 'Analytics & Reporting',
      items: [
        { 
          id: 'analytics',
          name: 'Analytics', 
          href: '/analytics', 
          icon: BarChart3,
          roles: ['SA', 'AD', 'AP']
        },
        { 
          id: 'reports',
          name: 'Reports', 
          href: '/reports', 
          icon: FileText,
          roles: ['SA', 'AD', 'AP']
        }
      ]
    },
    {
      id: 'system-tools',
      label: 'System & Tools',
      items: [
        { 
          id: 'crm',
          name: 'CRM', 
          href: '/crm', 
          icon: Briefcase,
          roles: ['SA', 'AD'],
          enterprise: true
        },
        { 
          id: 'system-monitoring',
          name: 'System Monitoring', 
          href: '/system-monitoring', 
          icon: Monitor,
          roles: ['SA', 'AD'],
          enterprise: true
        },
        { 
          id: 'backup-management',
          name: 'Backup Management', 
          href: '/backup-management', 
          icon: Database,
          roles: ['SA'],
          enterprise: true
        },
        { 
          id: 'settings',
          name: 'Settings', 
          href: '/settings', 
          icon: Settings,
          roles: ['SA', 'AD', 'AP']
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const hasAccess = (item: any) => {
    if (!profile?.role) return false;
    return item.roles.includes(profile.role);
  };

  const isGroupVisible = (groupId: string) => {
    return visibleGroups.includes(groupId);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarContent>
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(hasAccess);
          
          if (visibleItems.length === 0 || !isGroupVisible(group.id)) {
            return null;
          }

          return (
            <SidebarGroup key={group.id}>
              {!collapsed && (
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.name}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
