
import { Home, UserCircle2, ScrollText, Settings, Shield } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('AppSidebar: Fetching profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error('AppSidebar: Error fetching profile:', error);
        throw error;
      }
      console.log('AppSidebar: Profile data:', data);
      return data;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

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
      title: "Profile",
      icon: UserCircle2,
      url: "/profile",
    }
  ];

  if (!user || isLoading) return null;

  // Add admin-only menu items
  if (profile?.role === 'SA' || profile?.role === 'AD') {
    items.push({
      title: "Settings",
      icon: Settings,
      url: "/settings",
    });
  }

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
