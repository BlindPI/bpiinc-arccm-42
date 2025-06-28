
import {
  LayoutDashboard,
  Users,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  Building,
  Shield,
  Zap,
  UserCheck,
  CreditCard
} from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Core navigation items that all authenticated users can access
  const coreNavigationItems = [
    {
      title: "Dashboard",
      path: "/dashboard", // Fixed: was "/" now "/dashboard"
      icon: LayoutDashboard
    },
    {
      title: "Teams", 
      path: "/teams",
      icon: Users
    },
    {
      title: "Certificates",
      path: "/certificates", 
      icon: GraduationCap
    },
    {
      title: "Analytics",
      path: "/analytics",
      icon: BarChart3
    }
  ];

  // Advanced features for specific roles
  const advancedNavigationItems = [
    {
      title: "CRM",
      path: "/crm",
      icon: CreditCard
    },
    {
      title: "Automation",
      path: "/automation", 
      icon: Zap
    },
    {
      title: "Compliance Admin",
      path: "/compliance-dashboard/admin",
      icon: Shield
    },
    {
      title: "User Management",  
      path: "/users",
      icon: UserCheck
    }
  ];

  // Settings and profile
  const userNavigationItems = [
    {
      title: "Profile",
      path: "/profile",
      icon: Users
    },
    {
      title: "Settings",
      path: "/settings",
      icon: Settings
    }
  ];

  // Helper function to render menu items
  const renderMenuItems = (items: typeof coreNavigationItems) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={location.pathname === item.path}
          className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
        >
          <Link to={item.path} className="flex items-center w-full gap-3">
            <item.icon className={`h-5 w-5 transition-colors duration-200 ${location.pathname === item.path ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />
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
          <Link to="/dashboard" className="hover:opacity-90 transition-opacity">
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
        
        {/* Core Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(coreNavigationItems)}
          </SidebarMenu>
        </SidebarGroup>
        
        {/* Advanced Features */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Advanced Features
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(advancedNavigationItems)}
          </SidebarMenu>
        </SidebarGroup>
        
        {/* User Section */}
        <div className="mt-auto flex flex-col">
          <div className="px-4 py-3 border-t border-muted bg-muted/40 rounded-b-lg flex flex-col gap-2 shadow-inner">
            {userNavigationItems.map((item) => (
              <Link 
                key={item.title}
                to={item.path} 
                className={`flex items-center gap-3 w-full py-2 px-3 transition-all duration-200 rounded-md ${
                  location.pathname === item.path 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:text-blue-800 hover:bg-blue-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-[15px]">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
