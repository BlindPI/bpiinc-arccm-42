
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
  DollarSign,
  UserCheck,
  FileCheck,
  Building2,
  Mail
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
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Use the same navigation structure as AppSidebar for consistency
const navigation = [
  // Dashboard Group
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Dashboard' },
  { name: 'Profile', href: '/profile', icon: User, group: 'Dashboard' },
  
  // User Management Group
  { name: 'Users', href: '/users', icon: Users, group: 'User Management' },
  { name: 'Role Management', href: '/role-management', icon: Shield, group: 'User Management' },
  { name: 'Supervision', href: '/supervision', icon: UserCheck, group: 'User Management' },
  
  // Training Management Group - Expanded System (matching AppSidebar)
  { name: 'Instructor System', href: '/instructor-system', icon: GraduationCap, group: 'Training Management' },
  { name: 'Training Sessions', href: '/instructor-system?tab=sessions', icon: ClipboardList, group: 'Training Management' },
  { name: 'Student Management', href: '/instructor-system?tab=students', icon: Users, group: 'Training Management' },
  { name: 'Instructor Management', href: '/instructor-system?tab=instructors', icon: UserCheck, group: 'Training Management' },
  { name: 'Multi-Course Builder', href: '/multi-course-training', icon: BookOpen, group: 'Training Management' },
  { name: 'Teams', href: '/teams', icon: UsersIcon, group: 'Training Management' },
  { name: 'Locations', href: '/locations', icon: MapPin, group: 'Training Management' },
  { name: 'Courses', href: '/courses', icon: GraduationCap, group: 'Training Management' },
  { name: 'Training Management', href: '/training-management', icon: BookOpen, group: 'Training Management' },
  { name: 'Enrollments', href: '/enrollments', icon: ClipboardList, group: 'Training Management' },
  
  // Certificates Group
  { name: 'Certificates', href: '/certificates', icon: FileText, group: 'Certificates' },
  { name: 'Certificate Analytics', href: '/certificate-analytics', icon: Award, group: 'Certificates' },
  { name: 'Rosters', href: '/rosters', icon: ClipboardList, group: 'Certificates' },
  
  // CRM Group
  { name: 'CRM Dashboard', href: '/crm', icon: Briefcase, group: 'CRM' },
  { name: 'Account Management', href: '/crm/accounts', icon: Building2, group: 'CRM' },
  { name: 'Contact Management', href: '/crm/contacts', icon: Users, group: 'CRM' },
  { name: 'Lead Management', href: '/crm/leads', icon: UserPlus, group: 'CRM' },
  { name: 'Opportunities', href: '/crm/opportunities', icon: Target, group: 'CRM' },
  { name: 'Activities', href: '/crm/activities', icon: Activity, group: 'CRM' },
  { name: 'Email Workflows', href: '/crm/email-workflows', icon: Mail, group: 'CRM' },
  { name: 'Campaign Management', href: '/crm/campaigns', icon: Mail, group: 'CRM' },
  { name: 'Analytics Dashboard', href: '/crm/analytics', icon: BarChart3, group: 'CRM' },
  { name: 'Revenue Analytics', href: '/crm/revenue', icon: DollarSign, group: 'CRM' },
  
  // Analytics & Reports Group
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, group: 'Analytics & Reports' },
  { name: 'Executive Dashboard', href: '/executive-dashboard', icon: PieChart, group: 'Analytics & Reports' },
  { name: 'Report Scheduler', href: '/report-scheduler', icon: Clock, group: 'Analytics & Reports' },
  { name: 'Reports', href: '/reports', icon: BarChart3, group: 'Analytics & Reports' },
  
  // Compliance & Automation Group
  { name: 'Automation', href: '/automation', icon: Zap, group: 'Compliance & Automation' },
  { name: 'Progression Path Builder', href: '/progression-path-builder', icon: Target, group: 'Compliance & Automation' },
  
  // System Administration Group
  { name: 'Integrations', href: '/integrations', icon: Globe, group: 'System Administration' },
  { name: 'Notifications', href: '/notifications', icon: Bell, group: 'System Administration' },
  { name: 'System Monitoring', href: '/system-monitoring', icon: Monitor, group: 'System Administration' },
  { name: 'Settings', href: '/settings', icon: Settings, group: 'System Administration' }
];

// Mobile-specific group configuration for UX
const mobileGroupConfig = {
  'Dashboard': { priority: 1, collapsible: false },
  'User Management': { priority: 2, collapsible: true },
  'Training Management': { priority: 3, collapsible: true },
  'Certificates': { priority: 4, collapsible: true },
  'CRM': { priority: 5, collapsible: true },
  'Analytics & Reports': { priority: 6, collapsible: true },
  'Compliance & Automation': { priority: 7, collapsible: true },
  'System Administration': { priority: 8, collapsible: true }
};

export function MobileSidebar() {
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  const { isGroupVisible, isItemVisible, isLoading: navLoading } = useNavigationVisibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Dashboard', 'User Management'])
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

  // Filter navigation items using database-driven visibility (same as AppSidebar)
  const visibleItems = navigation.filter(item => {
    console.log(`🔧 MOBILE-SIDEBAR: Checking visibility for item: ${item.name} in group: ${item.group}`);
    
    // First check if the group is visible
    if (!isGroupVisible(item.group)) {
      console.log(`🔧 MOBILE-SIDEBAR: Group ${item.group} not visible, hiding ${item.name}`);
      return false;
    }
    
    // Then check if the specific item is visible
    const itemVisible = isItemVisible(item.group, item.name);
    console.log(`🔧 MOBILE-SIDEBAR: Item ${item.name} visibility: ${itemVisible}`);
    
    // Apply search filtering if search term exists
    if (searchTerm && itemVisible) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return itemVisible;
  });

  console.log(`🔧 MOBILE-SIDEBAR: Total visible items for role ${profile?.role}:`, visibleItems.length);
  console.log(`🔧 MOBILE-SIDEBAR: Visible items:`, visibleItems.map(i => i.name));

  // Group visible navigation items by group
  const groupedItems = visibleItems.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  // Create mobile-friendly group structure
  const filteredGroups = Object.entries(groupedItems)
    .map(([groupName, items]) => ({
      name: groupName,
      items,
      ...mobileGroupConfig[groupName as keyof typeof mobileGroupConfig]
    }))
    .filter(group => group.items.length > 0)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  if (isLoading || navLoading) {
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
