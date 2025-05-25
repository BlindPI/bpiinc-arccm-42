
import { Building, GraduationCap, Home, MapPin, ScrollText, Users, Settings } from "lucide-react";
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
      visible: isAdmin, 
    },
    {
      title: "Locations",
      icon: MapPin,
      url: "/locations",
      visible: isAdmin, 
    },
    {
      title: "Users",
      icon: Users,
      url: "/user-management",
      visible: isAdmin, 
    },
    {
      title: "Role Management",
      icon: Building,
      url: "/role-management",
      visible: isAdmin || isInstructor, 
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
      visible: isAdmin,
    }
  ];

  if (!user || isLoading) return null;

  const visibleItems = navigationItems.filter(item => item.visible);

  return (
    <Sidebar>
      <SidebarContent>
        {/* Brand area */}
        <div className="flex flex-col items-center justify-center pb-2 pt-6 border-b border-muted bg-gradient-to-br from-blue-500 to-purple-500">
          <img 
            src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
            alt="Assured Response Logo"
            className="h-10 w-auto rounded-lg shadow-md bg-white/80 p-1"
            style={{ minWidth: '110px' }}
          />
          <div className="mt-2 font-semibold text-sm text-white tracking-wide text-center">
            Assured Response
          </div>
        </div>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-colors duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
                >
                  <Link to={item.url} className="flex items-center w-full gap-3">
                    <item.icon className={`h-5 w-5 transition-colors duration-200 ${location.pathname === item.url ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />
                    <span className="font-medium text-[15px]">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {/* User quickview */}
        <div className="mt-auto px-4 py-3 border-t border-muted bg-muted/40 rounded-b-lg flex flex-col gap-2 shadow-inner">
          <span className="text-xs text-gray-500">Signed in as</span>
          <span className="font-medium text-[15px] text-gray-800 truncate">{user.email}</span>
          {profile?.role && (
            <span className="text-xs text-blue-600 font-semibold">{profile.role}</span>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
