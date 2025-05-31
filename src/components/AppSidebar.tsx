
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
  ClipboardList,
  Bug,
  AlertTriangle
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { 
    navigationConfig, 
    isLoading: navConfigLoading, 
    isGroupVisible, 
    isItemVisible,
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides
  } = useNavigationVisibility();

  console.log('🔧 APPSIDEBAR: === RENDER START ===');
  console.log('🔧 APPSIDEBAR: Current state:', {
    profileRole: profile?.role,
    profileLoading,
    navConfigLoading,
    hasNavigationConfig: !!navigationConfig,
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides,
    location: location.pathname
  });

  // Group navigation items and filter based on role-specific visibility WITH team/provider overrides
  const getFilteredGroupedNavigation = () => {
    if (profileLoading || navConfigLoading || !profile?.role) {
      console.log('🔧 APPSIDEBAR: Dependencies not ready, returning empty navigation');
      return {};
    }

    if (!navigationConfig) {
      console.log('🔧 APPSIDEBAR: No navigation config available for role:', profile.role);
      return {};
    }

    console.log('🔧 APPSIDEBAR: === FILTERING NAVIGATION START ===');
    console.log('🔧 APPSIDEBAR: Filtering navigation for role:', profile.role, 'with overrides:', {
      team: hasTeamOverrides,
      provider: hasProviderOverrides
    });
    console.log('🔧 APPSIDEBAR: Active navigation config:', navigationConfig);

    const result = navigation.reduce((acc, item) => {
      const groupVisible = isGroupVisible(item.group);
      const itemVisible = isItemVisible(item.group, item.name);
      const finalVisible = groupVisible && itemVisible;
      
      console.log('🔧 APPSIDEBAR: === ITEM FILTER ===', {
        item: item.name,
        group: item.group,
        groupVisible,
        itemVisible,
        finalVisible,
        userRole: profile.role,
        hasOverrides: hasTeamOverrides || hasProviderOverrides,
        groupConfig: navigationConfig[item.group],
        itemConfig: navigationConfig[item.group]?.items?.[item.name]
      });

      if (finalVisible) {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        console.log('🔧 APPSIDEBAR: Added item to navigation:', item.name, 'in group:', item.group);
      } else {
        console.log('🔧 APPSIDEBAR: Excluded item from navigation:', item.name, 'in group:', item.group);
      }
      
      return acc;
    }, {} as Record<string, typeof navigation>);

    console.log('🔧 APPSIDEBAR: === FILTERING COMPLETE ===');
    console.log('🔧 APPSIDEBAR: Final filtered groups for role', profile.role, ':', Object.keys(result));
    console.log('🔧 APPSIDEBAR: Total items per group:', Object.entries(result).map(([group, items]) => `${group}: ${items.length}`));
    
    return result;
  };

  const groupedNavigation = getFilteredGroupedNavigation();

  // Show loading state while ANY dependency is loading
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
                Loading navigation...
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

        {/* Configuration Health Alert */}
        {configurationHealth.status === 'error' && (
          <div className="p-2 m-2">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Navigation Error: {configurationHealth.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* ENHANCED Debug Info Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 m-2 text-xs">
            <div className="flex items-center gap-1 mb-1">
              <Bug className="h-3 w-3 text-yellow-600" />
              <span className="font-medium text-yellow-800">Navigation Debug</span>
            </div>
            <div className="text-yellow-700 space-y-1">
              <div>Role: <Badge variant="outline" className="text-xs">{profile?.role}</Badge></div>
              <div>Visible Groups: {Object.keys(groupedNavigation).length}</div>
              <div>Config Status: <Badge variant={configurationHealth.status === 'healthy' ? 'default' : 'destructive'}>{configurationHealth.status}</Badge></div>
              <div>Config Source: {navigationConfig ? 'Database + Overrides' : 'None'}</div>
              <div>Team Overrides: {hasTeamOverrides ? '✓' : '✗'}</div>
              <div>Provider Overrides: {hasProviderOverrides ? '✓' : '✗'}</div>
              <div className="text-xs border-t border-yellow-300 pt-1 mt-1">
                <div className="font-medium text-yellow-800">Active Config Sample:</div>
                {navigationConfig && Object.entries(navigationConfig).slice(0, 2).map(([groupName, groupConfig]) => (
                  <div key={groupName} className="text-xs">
                    • {groupName}: enabled={String(groupConfig.enabled)}
                  </div>
                ))}
              </div>
              <div className="text-xs border-t border-yellow-300 pt-1 mt-1">
                <div className="font-medium text-yellow-800">Visible Groups:</div>
                {Object.entries(groupedNavigation).map(([groupName, items]) => (
                  <div key={groupName} className="text-green-600 text-xs">
                    • {groupName}: {items.length} items
                  </div>
                ))}
                {Object.keys(groupedNavigation).length === 0 && (
                  <div className="text-red-600 text-xs">⚠️ No groups visible</div>
                )}
              </div>
            </div>
          </div>
        )}
        
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
          
          {/* Enhanced error message with detailed diagnosis */}
          {Object.keys(groupedNavigation).length === 0 && (
            <SidebarGroup className="px-2 py-2">
              <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Navigation Issue
              </SidebarGroupLabel>
              <div className="p-4 text-center text-muted-foreground text-sm space-y-2">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">No Navigation Available</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Role: <Badge variant="outline">{profile?.role}</Badge></div>
                  <div>Status: <Badge variant={configurationHealth.status === 'healthy' ? 'default' : 'destructive'}>{configurationHealth.status}</Badge></div>
                  <div>Has Config: {navigationConfig ? 'Yes' : 'No'}</div>
                  <div>Team Overrides: {hasTeamOverrides ? 'Active' : 'None'}</div>
                  <div>Provider Overrides: {hasProviderOverrides ? 'Active' : 'None'}</div>
                  <div className="text-red-600 mt-1 text-xs">
                    {configurationHealth.message}
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    Check Settings → Navigation to configure role permissions.
                  </div>
                </div>
              </div>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
