
import { Home, UserCircle2, ScrollText, Settings, Shield, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();

  const items = [
    {
      title: "Dashboard",
      icon: Home,
      url: "/",
    },
    {
      title: "Certifications",
      icon: ScrollText,
      url: "/certifications",
    },
    {
      title: "Role Management",
      icon: Shield,
      url: "/role-management",
    }
  ];

  // Add admin-only menu items
  if (profile?.role === 'SA' || profile?.role === 'AD') {
    items.push({
      title: "User Management",
      icon: UserCog,
      url: "/user-management",
    });
  }

  // Add these items for all users
  items.push(
    {
      title: "Profile",
      icon: UserCircle2,
      url: "/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
    }
  );

  if (!user || isLoading) return null;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => navigate(item.url)}
                  isActive={location.pathname === item.url}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
