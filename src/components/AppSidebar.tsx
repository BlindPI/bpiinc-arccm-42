
import { Building, GraduationCap, Home, MapPin, ScrollText, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/useProfile";

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isInstructor = profile?.role && ['AP', 'IC', 'IP', 'IT'].includes(profile.role);

  const navigationItems = [
    {
      title: "Dashboard",
      icon: Home,
      url: "/",
      visible: true,
    },
    {
      title: "Certifications",
      icon: ScrollText,
      url: "/certifications",
      visible: true,
    },
    {
      title: "Courses",
      icon: GraduationCap,
      url: "/courses",
      visible: isAdmin, // Only admin can manage courses
    },
    {
      title: "Locations",
      icon: MapPin,
      url: "/locations",
      visible: isAdmin, // Only admin can manage locations
    },
    {
      title: "Users",
      icon: Users,
      url: "/user-management",
      visible: isAdmin, // Only admin can manage users
    },
    {
      title: "Role Management",
      icon: Building,
      url: "/role-management",
      visible: isAdmin || isInstructor, // Admin and instructors can access
    }
  ];

  if (!user || isLoading) return null;

  const visibleItems = navigationItems.filter(item => item.visible);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                >
                  <Link to={item.url} className="flex items-center w-full">
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
