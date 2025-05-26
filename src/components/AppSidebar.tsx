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
  User,
  Calendar,
  UserCheck,
  BookOpen,
  UsersIcon,
  ClipboardList
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

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isInstructor = profile?.role && ['AP', 'IC', 'IP', 'IT'].includes(profile.role);
  const isManager = profile?.role && ['AP', 'IC'].includes(profile.role);

  // Core features available to all users
  const coreNavigationItems = [
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
  ];

  // Shared public tools available to all authenticated users
  const sharedToolsItems = [
    {
      title: "Certificate Verification",
      icon: CheckCircle,
      url: "/verification",
      visible: true,
    },
  ];

  // Administrative features primarily for admins
  const adminNavigationItems = [
    {
      title: "Certificate Analytics",
      icon: BarChart2,
      url: "/certificate-analytics",
      visible: isAdmin,
    },
    {
      title: "Courses",
      icon: GraduationCap,
      url: "/courses",
      visible: isAdmin,
    },
    {
      title: "Course Offerings",
      icon: Calendar,
      url: "/course-offerings",
      visible: isAdmin,
    },
    {
      title: "Enrollments",
      icon: ClipboardList,
      url: "/enrollments",
      visible: isAdmin,
    },
    {
      title: "Instructors",
      icon: UserCheck,
      url: "/instructors",
      visible: isAdmin,
    },
    {
      title: "Teaching Sessions",
      icon: BookOpen,
      url: "/teaching-sessions",
      visible: isAdmin || isInstructor,
    },
    {
      title: "Teams",
      icon: Users,
      url: "/teams",
      visible: isAdmin || isManager,
    },
    {
      title: "Team Management",
      icon: UsersIcon,
      url: "/team-management",
      visible: isAdmin || isManager,
    },
    {
      title: "Progression Paths",
      icon: GitBranch,
      url: "/progression-paths",
      visible: isAdmin || isInstructor,
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
  ];

  // User-specific features
  const userNavigationItems = [
    {
      title: "My Team",
      icon: UserPlus,
      url: "/supervision",
      visible: isAdmin || isManager,
    },
    {
      title: "Profile",
      icon: User,
      url: "/profile",
      visible: true,
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
      visible: isAdmin,
    }
  ];

  if (!user || isLoading) return null;

  // Filter items based on visibility
  const visibleCoreItems = coreNavigationItems.filter(item => item.visible);
  const visibleSharedItems = sharedToolsItems.filter(item => item.visible);
  const visibleAdminItems = adminNavigationItems.filter(item => item.visible);
  const visibleUserItems = userNavigationItems.filter(item => item.visible);

  // Helper function to render menu items
  const renderMenuItems = (items) => {
    return items.map((item) => (
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
            {renderMenuItems(visibleCoreItems)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Shared Tools Group - Always visible for authenticated users */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            Public Tools
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(visibleSharedItems)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin Features Group - Only show if there are visible items */}
        {visibleAdminItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu>
              {renderMenuItems(visibleAdminItems)}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* User Features Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="pl-3 text-xs font-semibold text-muted-foreground tracking-wider">
            User
          </SidebarGroupLabel>
          <SidebarMenu>
            {renderMenuItems(visibleUserItems)}
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
