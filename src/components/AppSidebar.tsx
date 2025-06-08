
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
  UserPlus,
  Briefcase,
  DollarSign,
  Building2,
  Mail,
  Crown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useProfile } from '@/hooks/useProfile';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSidebar } from './MobileSidebar';

const navigation = [
  // Dashboard Group
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Dashboard' },
  { name: 'Profile', href: '/profile', icon: User, group: 'Dashboard' },
  
  // User Management Group
  { name: 'Users', href: '/users', icon: Users, group: 'User Management' },
  { name: 'Teams', href: '/teams', icon: UsersIcon, group: 'User Management' },
  { name: 'Enterprise Teams', href: '/enhanced-teams', icon: Crown, group: 'User Management', enterpriseOnly: true },
  { name: 'Role Management', href: '/role-management', icon: Shield, group: 'User Management' },
  { name: 'Supervision', href: '/supervision', icon: UserCheck, group: 'User Management' },
  
  // Training Management Group
  { name: 'Training Hub', href: '/training-hub', icon: BookOpen, group: 'Training Management' },
  { name: 'Courses', href: '/courses', icon: GraduationCap, group: 'Training Management' },
  { name: 'Enrollments', href: '/enrollments', icon: ClipboardList, group: 'Training Management' },
  { name: 'Enrollment Management', href: '/enrollment-management', icon: FileCheck, group: 'Training Management' },
  { name: 'Locations', href: '/locations', icon: MapPin, group: 'Training Management' },
  
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

export function AppSidebar() {
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  const { isGroupVisible, isItemVisible, isLoading: navLoading } = useNavigationVisibility();
  const isMobile = useIsMobile();

  // Use mobile-optimized sidebar on mobile devices
  if (isMobile) {
    return <MobileSidebar />;
  }

  if (isLoading || navLoading) {
    return (
      <Sidebar className="bg-sidebar border-sidebar-border">
        <SidebarHeader>
          <div className="flex items-center justify-center px-4 py-2">
            <div className="h-10 w-24 bg-sidebar-accent animate-pulse rounded-lg" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Check if user has enterprise access
  const hasEnterpriseAccess = ['SA', 'AD', 'AP'].includes(profile?.role);

  // Filter navigation items using database-driven visibility and enterprise access
  const visibleItems = navigation.filter(item => {
    console.log(`🔧 SIDEBAR: Checking visibility for item: ${item.name} in group: ${item.group}`);
    
    // Check enterprise access for enterprise-only items
    if (item.enterpriseOnly && !hasEnterpriseAccess) {
      console.log(`🔧 SIDEBAR: Enterprise item ${item.name} hidden - no enterprise access`);
      return false;
    }
    
    // First check if the group is visible
    if (!isGroupVisible(item.group)) {
      console.log(`🔧 SIDEBAR: Group ${item.group} not visible, hiding ${item.name}`);
      return false;
    }
    
    // Then check if the specific item is visible
    const itemVisible = isItemVisible(item.group, item.name);
    console.log(`🔧 SIDEBAR: Item ${item.name} visibility: ${itemVisible}`);
    
    return itemVisible;
  });

  console.log(`🔧 SIDEBAR: Total visible items for role ${profile?.role}:`, visibleItems.length);
  console.log(`🔧 SIDEBAR: Visible items:`, visibleItems.map(i => i.name));

  // Group visible navigation items
  const groupedItems = visibleItems.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <Sidebar className="bg-sidebar border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center justify-center px-4 py-3 border-b border-sidebar-border/50">
          <img
            src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
            alt="Assured Response Logo"
            className="h-10 w-auto rounded-lg shadow-md bg-white/90 p-1"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName}>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
              {groupName}
            </SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                const isEnterprise = item.enterpriseOnly;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${isEnterprise ? 'text-yellow-600' : ''}`} />
                        <span className="font-medium">{item.name}</span>
                        {isEnterprise && (
                          <Crown className="h-3 w-3 text-yellow-600 ml-auto" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
