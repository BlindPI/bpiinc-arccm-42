
import { Home, ScrollText } from "lucide-react";
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
    }
  ];

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
