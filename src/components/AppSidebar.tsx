
import { Home, UserCircle2, ScrollText, Settings, Shield, UserCog, Book, Users2 } from "lucide-react";
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
    },
    {
      title: "Supervision",
      icon: Users2,
      url: "/supervision",
    }
  ];

  // Add admin-only menu items (AD and SA roles)
  if (profile?.role === 'AD' || profile?.role === 'SA') {
    items.push(
      {
        title: "User Management",
        icon: UserCog,
        url: "/user-management",
      },
      {
        title: "Courses",
        icon: Book,
        url: "/courses",
      }
    );
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
