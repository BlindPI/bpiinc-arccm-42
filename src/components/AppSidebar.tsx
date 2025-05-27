
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  Settings,
  Zap,
  Globe,
  TrendingUp,
  MapPin,
  User,
  Building2
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Certificates', href: '/certificates', icon: FileText },
  { name: 'Courses', href: '/courses', icon: GraduationCap },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Integrations', href: '/integrations', icon: Globe },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        {/* Brand area */}
        <div className="flex flex-col items-center justify-center pb-2 pt-6 border-b border-muted bg-gradient-to-br from-blue-500 to-purple-500">
          <Link to="/" className="hover:opacity-90 transition-opacity">
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
        
        {/* Main Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Enterprise Training Management
          </SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="group flex items-center gap-3 w-full py-2 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 focus:bg-blue-100 aria-[active=true]:bg-blue-100 aria-[active=true]:text-blue-700"
                  >
                    <Link to={item.href} className="flex items-center w-full gap-3">
                      <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />
                      <span className="font-medium text-[15px]">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
