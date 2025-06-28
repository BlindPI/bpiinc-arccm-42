
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
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
  Database,
  ChevronRight
} from 'lucide-react';

export function MobileSidebar() {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { visibleGroups } = useNavigationVisibility();
  const [open, setOpen] = useState(false);

  const mobileGroupConfig = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      priority: 1,
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
      label: 'Provider & Compliance',
      priority: 2,
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
      priority: 3,
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
      priority: 4,
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
      priority: 5,
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
      priority: 6,
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
      priority: 7,
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

  // Sort groups by priority for mobile display
  const sortedGroups = mobileGroupConfig
    .filter(group => isGroupVisible(group.id))
    .sort((a, b) => a.priority - b.priority);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="px-4 py-6 border-b">
          <h2 className="text-lg font-semibold">Navigation</h2>
        </div>
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {sortedGroups.map((group) => {
              const visibleItems = group.items.filter(hasAccess);
              
              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <div key={group.id} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                        {item.enterprise && (
                          <Badge variant="secondary" className="text-xs">
                            Enterprise
                          </Badge>
                        )}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
