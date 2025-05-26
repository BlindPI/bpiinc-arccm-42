
import {
  Building,
  GraduationCap,
  Home,
  MapPin,
  ScrollText,
  Users,
  Settings,
  LogOut,
  CheckCircle,
  BarChart2,
  GitBranch,
  UserPlus,
  User
} from "lucide-react";
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
import { getSidebarRoutes } from "@/config/routes";

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();

  if (!user || isLoading) return null;

  // Get sidebar routes based on authentication and user role
  const allSidebarItems = getSidebarRoutes(true, profile?.role); // true = authenticated
  
  // Group items by category
  const coreItems = allSidebarItems.filter(item =>
    ['/', '/certifications', '/verification'].includes(item.path)
  );
  
  const adminItems = allSidebarItems.filter(item =>
    ['/certificate-analytics', '/courses', '/progression-paths', '/locations', '/user-management', '/role-management'].includes(item.path)
  );
  
  const userItems = allSidebarItems.filter(item =>
    ['/supervision', '/profile', '/settings'].includes(item.path)
  );

  // Helper function to render menu items
  const renderMenuItems = (items: typeof allSidebarItems) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={location.pathname === item.path}
          className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-colors duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
        >
          <Link to={item.path} className="flex items-center w-full gap-3">
            {item.icon && <item.icon className={`h-5 w-5 transition-colors duration-200 ${location.pathname === item.path ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />}
            <span className="font-medium text-[15px]">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

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
        {/* Core Features Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Core Features
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(coreItems)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin Features Group - Only show if there are visible items */}
        {adminItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu>
              {renderMenuItems(adminItems)}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* User Features Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            User
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(userItems)}
          </SidebarMenu>
        </SidebarGroup>
        {/* User quickview */}
        <div className="mt-auto flex flex-col">
          {/* Logout button for mobile */}
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full py-2 px-3 text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-md mb-2"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-[15px]">Sign Out</span>
          </button>
          
          {/* User info */}
          <div className="px-4 py-3 border-t border-muted bg-muted/40 rounded-b-lg flex flex-col gap-2 shadow-inner">
            <span className="text-xs text-gray-500">Signed in as</span>
            <span className="font-medium text-[15px] text-gray-800 truncate">{user.email}</span>
            {profile?.role && (
              <span className="text-xs text-blue-600 font-semibold">{profile.role}</span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
