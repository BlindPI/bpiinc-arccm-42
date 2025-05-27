
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
} from "@/components/ui/sidebar";

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

// Group navigation items
const groupedNavigation = navigation.reduce((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, typeof navigation>);

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        {/* Brand area */}
        <div className="flex flex-col items-center justify-center pb-2 pt-6 border-b border-muted bg-gradient-to-br from-blue-500 to-purple-500">
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
        {Object.entries(groupedNavigation).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="mt-4">
            <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
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
                      className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
                    >
                      <Link to={item.href} className="flex items-center w-full gap-3">
                        <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />
                        <span className="font-medium text-[15px]">{item.name}</span>
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
};
