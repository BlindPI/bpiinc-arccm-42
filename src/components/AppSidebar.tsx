
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
  LayoutDashboard,
  User,
  Settings,
  BookOpen,
  Calendar,
  Users,
  ShieldCheck,
  Bell,
  Building2,
  GraduationCap,
  ListChecks,
  FileText,
  BarChart4,
  LucideIcon,
  MapPin,
  LogOut,
  TrendingUp,
  Activity,
  FileBarChart,
  Award,
  Monitor
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

const NavItem = ({ icon, label, href }: NavItemProps) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <Link to={href} className="flex items-center gap-2">
        {React.createElement(icon, { className: "h-4 w-4" })}
        {label}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

export const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const userRole = profile?.role || 'IN';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar className="bg-secondary/50 border-r border-border/50">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-4 px-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg">CPR-360</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea>
          {/* User Profile Section */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || user?.photoURL || ""} />
                <AvatarFallback>{profile?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.display_name || user?.displayName || "Guest User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu>
                <NavItem icon={LayoutDashboard} label="Dashboard" href="/" />
                <NavItem icon={User} label="Profile" href="/profile" />
                <NavItem icon={Settings} label="Settings" href="/settings" />
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>

          {/* My Work - For all authenticated users */}
          <SidebarGroup>
            <SidebarGroupLabel>My Work</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu>
                <NavItem icon={Award} label="Certifications" href="/certifications" />
                <NavItem icon={Bell} label="Notifications" href="/notifications" />
                <NavItem icon={ShieldCheck} label="Compliance" href="/compliance" />
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>

          {(userRole === 'SA' || userRole === 'AD' || userRole === 'AP') && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <NavItem icon={Users} label="User Management" href="/users" />
                  <NavItem icon={BookOpen} label="Course Management" href="/courses" />
                  <NavItem icon={Calendar} label="Course Offerings" href="/course-offerings-management" />
                  <NavItem icon={Calendar} label="Course Scheduling" href="/course-scheduling" />
                  <NavItem icon={MapPin} label="Location Management" href="/locations" />
                  <NavItem icon={ListChecks} label="Enrollment Management" href="/enrollments" />
                  <NavItem icon={GraduationCap} label="Teaching Management" href="/teaching-management" />
                  <NavItem icon={FileText} label="Roster Management" href="/rosters" />
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}

          {/* Analytics & Reporting - For Admins */}
          {(userRole === 'SA' || userRole === 'AD' || userRole === 'AP') && (
            <SidebarGroup>
              <SidebarGroupLabel>Analytics & Reporting</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <NavItem icon={BarChart4} label="Certificate Analytics" href="/certificate-analytics" />
                  <NavItem icon={TrendingUp} label="Instructor Performance" href="/instructor-performance" />
                  {userRole === 'SA' && (
                    <NavItem icon={Activity} label="Executive Dashboard" href="/executive-dashboard" />
                  )}
                  {(userRole === 'SA' || userRole === 'AD') && (
                    <NavItem icon={FileBarChart} label="Report Scheduler" href="/report-scheduler" />
                  )}
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}

          {/* System Administration - For SA only */}
          {userRole === 'SA' && (
            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <NavItem icon={Monitor} label="System Monitoring" href="/system-monitoring" />
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}

          {(userRole === 'IC' || userRole === 'IP' || userRole === 'IT') && (
            <SidebarGroup>
              <SidebarGroupLabel>Instructor Tools</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <NavItem icon={GraduationCap} label="Teaching Management" href="/teaching-management" />
                  <NavItem icon={FileText} label="My Rosters" href="/rosters" />
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
