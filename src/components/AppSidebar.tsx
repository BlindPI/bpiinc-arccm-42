
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  Settings,
  Zap,
  Globe,
  TrendingUp,
  MapPin,
  User,
  Building2,
  Shield,
  Calendar,
  UserCheck,
  Award,
  Bell,
  Monitor,
  FileCheck,
  Clock,
  UsersIcon,
  BookOpen,
  Target,
  PieChart,
  Activity,
  ClipboardList
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { useProfile } from '@/hooks/useProfile';

const navigation = [
  // Dashboard Group
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Dashboard' },
  { name: 'Profile', href: '/profile', icon: User, group: 'Dashboard' },
  
  // User Management Group
  { name: 'Users', href: '/users', icon: Users, group: 'User Management' },
  { name: 'Teams', href: '/teams', icon: UsersIcon, group: 'User Management' },
  { name: 'Role Management', href: '/role-management', icon: Shield, group: 'User Management' },
  { name: 'Supervision', href: '/supervision', icon: UserCheck, group: 'User Management' },
  
  // Training Management Group
  { name: 'Courses', href: '/courses', icon: GraduationCap, group: 'Training Management' },
  { name: 'Course Scheduling', href: '/course-scheduling', icon: Calendar, group: 'Training Management' },
  { name: 'Course Offerings', href: '/course-offerings', icon: BookOpen, group: 'Training Management' },
  { name: 'Enrollments', href: '/enrollments', icon: ClipboardList, group: 'Training Management' },
  { name: 'Enrollment Management', href: '/enrollment-management', icon: FileCheck, group: 'Training Management' },
  { name: 'Teaching Sessions', href: '/teaching-sessions', icon: Clock, group: 'Training Management' },
  { name: 'Locations', href: '/locations', icon: MapPin, group: 'Training Management' },
  
  // Certificates Group
  { name: 'Certificates', href: '/certificates', icon: FileText, group: 'Certificates' },
  { name: 'Certificate Analytics', href: '/certificate-analytics', icon: Award, group: 'Certificates' },
  { name: 'Rosters', href: '/rosters', icon: ClipboardList, group: 'Certificates' },
  
  // Analytics & Reports Group
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, group: 'Analytics & Reports' },
  { name: 'Executive Dashboard', href: '/executive-dashboard', icon: PieChart, group: 'Analytics & Reports' },
  { name: 'Instructor Performance', href: '/instructor-performance', icon: Activity, group: 'Analytics & Reports' },
  { name: 'Report Scheduler', href: '/report-scheduler', icon: Clock, group: 'Analytics & Reports' },
  { name: 'Reports', href: '/reports', icon: BarChart3, group: 'Analytics & Reports' },
  
  // Compliance & Automation Group
  { name: 'Automation', href: '/automation', icon: Zap, group: 'Compliance & Automation' },
  { name: 'Progression Path Builder', href: '/progression-path-builder', icon: Target, group: 'Compliance & Automation' },
  
  // System Administration Group
  { name: 'Integrations', href: '/integrations', icon: Globe, group: 'System Administration' },
  { name: 'Notifications', href: '/notifications', icon: Bell, group: 'System Administration' },
  { name: 'System Monitoring', href: '/system-monitoring', icon: Monitor, group: 'System Administration' },
  { name: 'Settings', href: '/settings', icon: Settings, group: 'System Administration' },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { navigationConfig, isLoading: navConfigLoading, isGroupVisible, isItemVisible } = useNavigationVisibility();

  console.log('🔍 AppSidebar: Navigation visibility state:', {
    profile: profile?.role,
    profileLoading,
    navConfigLoading,
    navigationConfig: !!navigationConfig,
    location: location.pathname
  });

  // Group navigation items and filter based on visibility
  const getFilteredGroupedNavigation = () => {
    // If still loading critical data, return empty navigation to prevent showing everything
    if (profileLoading || navConfigLoading || !profile?.role || !navigationConfig) {
      console.log('🔍 AppSidebar: Still loading data, returning empty navigation');
      return {};
    }

    console.log('🔍 AppSidebar: Filtering navigation for role:', profile.role);

    return navigation.reduce((acc, item) => {
      // Check if the group and item should be visible for this role
      const groupVisible = isGroupVisible(item.group);
      const itemVisible = isItemVisible(item.group, item.name);
      
      console.log('🔍 AppSidebar: Checking visibility for', item.name, 'in group', item.group, ':', {
        groupVisible,
        itemVisible,
        finalVisible: groupVisible && itemVisible
      });

      if (groupVisible && itemVisible) {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
      }
      return acc;
    }, {} as Record<string, typeof navigation>);
  };

  const groupedNavigation = getFilteredGroupedNavigation();

  // Show loading state while data is being fetched
  if (profileLoading || navConfigLoading || !profile?.role) {
    return (
      <Sidebar className="border-r">
        <SidebarContent>
          {/* Brand area */}
          <div className="flex flex-col items-center justify-center pb-4 pt-6 px-4 border-b border-border bg-gradient-to-br from-blue-500 to-purple-500">
            <Link to="/" className="hover:opacity-90 transition-opacity">
              <img 
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-10 w-auto rounded-lg shadow-md bg-white/80 p-1"
                style={{ minWidth: '110px' }}
              />
            </Link>
            <div className="mt-2 font-semibold text-sm text-white tracking-wide text-center">
              Assured Response
            </div>
          </div>
          
          {/* Loading skeleton */}
          <div className="flex-1 overflow-auto">
            <SidebarGroup className="px-2 py-2">
              <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Loading...
              </SidebarGroupLabel>
              <SidebarMenu>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  console.log('🔍 AppSidebar: Final grouped navigation:', Object.keys(groupedNavigation));

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Brand area */}
        <div className="flex flex-col items-center justify-center pb-4 pt-6 px-4 border-b border-border bg-gradient-to-br from-blue-500 to-purple-500">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <img 
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-10 w-auto rounded-lg shadow-md bg-white/80 p-1"
              style={{ minWidth: '110px' }}
            />
          </Link>
          <div className="mt-2 font-semibold text-sm text-white tracking-wide text-center">
            Assured Response
          </div>
        </div>
        
        {/* Navigation Groups */}
        <div className="flex-1 overflow-auto">
          {Object.entries(groupedNavigation).map(([groupName, items]) => {
            // Skip empty groups
            if (!items.length) return null;

            return (
              <SidebarGroup key={groupName} className="px-2 py-2">
                <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  {groupName}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="w-full rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        >
                          <Link to={item.href} className="flex items-center w-full gap-3 py-2 px-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-sm truncate">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
          
          {/* Show message if no navigation items are visible */}
          {Object.keys(groupedNavigation).length === 0 && (
            <SidebarGroup className="px-2 py-2">
              <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                No Access
              </SidebarGroupLabel>
              <div className="p-4 text-center text-muted-foreground text-sm">
                No navigation items are visible for your current role.
              </div>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
