
import {
  LogIn,
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

export function PublicSidebar() {
  const location = useLocation();
  
  // Public navigation items that should be visible in the sidebar
  const publicNavigationItems = [
    {
      title: "Certificate Verification",
      path: "/verify",
      icon: null
    }
  ];

  // Helper function to render menu items
  const renderMenuItems = (items: typeof publicNavigationItems) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={location.pathname === item.path}
          className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
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
          <Link to="/landing" className="hover:opacity-90 transition-opacity">
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
        
        {/* Public Tools Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Public Tools
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(publicNavigationItems)}
          </SidebarMenu>
        </SidebarGroup>
        
        {/* Authentication call-to-action */}
        <div className="mt-auto flex flex-col">
          <div className="px-4 py-3 border-t border-muted bg-muted/40 rounded-b-lg flex flex-col gap-2 shadow-inner">
            <Link 
              to="/auth/signin" 
              className="flex items-center gap-3 w-full py-2 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 rounded-md"
            >
              <LogIn className="h-5 w-5" />
              <span className="font-medium text-[15px]">Sign In / Register</span>
            </Link>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
