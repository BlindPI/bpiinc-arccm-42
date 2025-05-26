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
  Mail,
  Bell,
  Building2,
  GraduationCap,
  ListChecks,
  FileText,
  BarChart4,
  PlusCircle,
  LucideIcon,
  File,
  FilePlus2,
  BadgeCheck
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProfile,
  SidebarProfileName,
  SidebarProfileEmail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';

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
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();

  const userRole = profile?.role || 'IN';

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
          <SidebarProfile>
            <Avatar>
              <AvatarImage src={profile?.avatar_url || user?.photoURL || ""} />
              <AvatarFallback>{profile?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <SidebarProfileName>{profile?.display_name || user?.displayName || "Guest User"}</SidebarProfileName>
            <SidebarProfileEmail>{user?.email}</SidebarProfileEmail>
          </SidebarProfile>

          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu>
                <NavItem icon={LayoutDashboard} label="Dashboard" href="/" />
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>

          {(userRole === 'SA' || userRole === 'AD' || userRole === 'AP') && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/courses" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Course Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/course-offerings-management" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Course Offerings
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/course-scheduling" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Course Scheduling
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/locations" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/enrollments" className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Enrollment Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/teaching-management" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Teaching Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/rosters" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Roster Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/compliance" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Compliance
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}

          {(userRole === 'IC' || userRole === 'IP' || userRole === 'IT') && (
            <SidebarGroup>
              <SidebarGroupLabel>Instructor Tools</SidebarGroupLabel>
              <SidebarContent>
                <SidebarMenu>
                  <NavItem icon={LayoutDashboard} label="Dashboard" href="/" />
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/teaching-management" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Teaching Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/rosters" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        My Rosters
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/compliance" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Compliance
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
          <User className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
