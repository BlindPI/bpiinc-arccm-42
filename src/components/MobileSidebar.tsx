
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  User,
  Shield,
  UsersIcon,
  BookOpen,
  ClipboardList,
  MapPin,
  Award,
  TrendingUp,
  PieChart,
  Clock,
  Target,
  Zap,
  Globe,
  Bell,
  Monitor,
  ChevronDown,
  ChevronRight,
  Search,
  Briefcase,
  UserPlus,
  Activity,
  DollarSign
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavigationGroup {
  name: string;
  priority: number;
  collapsible: boolean;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    description?: string;
    requiredRoles?: string[];
  }>;
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Dashboard',
    priority: 1,
    collapsible: false,
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Profile', href: '/profile', icon: User }
    ]
  },
  {
    name: 'Core Functions',
    priority: 2,
    collapsible: true,
    items: [
      { name: 'Teams', href: '/teams', icon: UsersIcon },
      { name: 'Courses', href: '/courses', icon: GraduationCap },
      { name: 'Certificates', href: '/certificates', icon: FileText },
      { name: 'Users', href: '/users', icon: Users }
    ]
  },
  {
    name: 'Training & Learning',
    priority: 3,
    collapsible: true,
    items: [
      { name: 'Training Hub', href: '/training-hub', icon: BookOpen },
      { name: 'Enrollments', href: '/enrollments', icon: ClipboardList },
      { name: 'Locations', href: '/locations', icon: MapPin }
    ]
  },
  {
    name: 'CRM',
    priority: 4,
    collapsible: true,
    items: [
      { name: 'CRM Dashboard', href: '/crm', icon: Briefcase },
      { name: 'Lead Management', href: '/crm/leads', icon: UserPlus },
      { name: 'Opportunities', href: '/crm/opportunities', icon: Target },
      { name: 'Activities', href: '/crm/activities', icon: Activity },
      { name: 'Revenue Analytics', href: '/crm/revenue', icon: DollarSign }
    ]
  },
  {
    name: 'Analytics & Reports',
    priority: 5,
    collapsible: true,
    items: [
      { name: 'Analytics', href: '/analytics', icon: TrendingUp },
      { name: 'Executive Dashboard', href: '/executive-dashboard', icon: PieChart },
      { name: 'Reports', href: '/reports', icon: BarChart3 }
    ]
  },
  {
    name: 'Administration',
    priority: 6,
    collapsible: true,
    items: [
      { name: 'Role Management', href: '/role-management', icon: Shield },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'System Monitoring', href: '/system-monitoring', icon: Monitor, requiredRoles: ['SA'] }
    ]
  }
];

export function MobileSidebar() {
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Dashboard', 'Core Functions'])
  );

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const filterItems = (items: NavigationGroup['items']) => {
    return items.filter(item => {
      // Role-based filtering
      const userRole = profile?.role || 'IN';
      if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
        return false;
      }

      // Search filtering
      if (searchTerm) {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase());
      }

      return true;
    });
  };

  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: filterItems(group.items)
    }))
    .filter(group => group.items.length > 0)
    .sort((a, b) => a.priority - b.priority);

  if (isLoading) {
    return (
      <Sidebar className="sidebar-mobile-enhanced">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <div className="h-8 w-24 bg-sidebar-accent animate-pulse rounded" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-sidebar-accent animate-pulse rounded" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="sidebar-mobile-enhanced">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-8 w-auto rounded-md shadow-sm bg-white/90 p-1"
            />
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
            <Input
              placeholder="Search navigation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.name} className="sidebar-mobile-group">
            {group.collapsible ? (
              <Collapsible 
                open={expandedGroups.has(group.name)}
                onOpenChange={() => toggleGroup(group.name)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto sidebar-mobile-label hover:bg-sidebar-accent"
                  >
                    <span className="sidebar-mobile-text">{group.name}</span>
                    {expandedGroups.has(group.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive}
                            className="sidebar-mobile-item"
                          >
                            <Link to={item.href} className="flex items-center gap-3 p-3">
                              <item.icon className="sidebar-mobile-icon" />
                              <span className="sidebar-mobile-text">{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <div className="sidebar-mobile-label px-3 py-2">
                  {group.name}
                </div>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className="sidebar-mobile-item"
                        >
                          <Link to={item.href} className="flex items-center gap-3 p-3">
                            <item.icon className="sidebar-mobile-icon" />
                            <span className="sidebar-mobile-text">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
