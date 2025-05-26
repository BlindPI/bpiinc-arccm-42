import { 
  Home, 
  ScrollText, 
  CheckCircle, 
  GraduationCap,
  MapPin,
  Users,
  Settings,
  BarChart2,
  GitBranch,
  UserPlus,
  User,
  Building
} from "lucide-react";

export interface RouteConfig {
  path: string;
  title: string;
  icon?: any;
  isPublic: boolean;
  showInSidebar: boolean;
  showHeader: boolean;
  showBreadcrumbs: boolean;
  requiredRoles?: string[];
  simplified?: boolean;
}

export const ROUTES: Record<string, RouteConfig> = {
  home: {
    path: "/",
    title: "Dashboard",
    icon: Home,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
  },
  verification: {
    path: "/verification",
    title: "Certificate Verification",
    icon: CheckCircle,
    isPublic: true,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: false,
    simplified: true,
  },
  certifications: {
    path: "/certifications",
    title: "Certifications",
    icon: ScrollText,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
  },
  courses: {
    path: "/courses",
    title: "Courses",
    icon: GraduationCap,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD'],
  },
  locations: {
    path: "/locations",
    title: "Locations",
    icon: MapPin,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD'],
  },
  userManagement: {
    path: "/user-management",
    title: "Users",
    icon: Users,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD'],
  },
  profile: {
    path: "/profile",
    title: "Profile",
    icon: User,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
  },
  supervision: {
    path: "/supervision",
    title: "My Team",
    icon: UserPlus,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD', 'AP', 'IC'],
  },
  settings: {
    path: "/settings",
    title: "Settings",
    icon: Settings,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD'],
  },
  roleManagement: {
    path: "/role-management",
    title: "Role Management",
    icon: Building,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'],
  },
  progressionPaths: {
    path: "/progression-paths",
    title: "Progression Paths",
    icon: GitBranch,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'],
  },
  certificateAnalytics: {
    path: "/certificate-analytics",
    title: "Certificate Analytics",
    icon: BarChart2,
    isPublic: false,
    showInSidebar: true,
    showHeader: true,
    showBreadcrumbs: true,
    requiredRoles: ['SA', 'AD'],
  },
  auth: {
    path: "/auth",
    title: "Authentication",
    isPublic: true,
    showInSidebar: false,
    showHeader: false,
    showBreadcrumbs: false,
  },
  acceptInvitation: {
    path: "/accept-invitation",
    title: "Accept Invitation",
    isPublic: true,
    showInSidebar: false,
    showHeader: false,
    showBreadcrumbs: false,
  },
};

// Pages that should always use PublicLayout regardless of auth state
export const ALWAYS_PUBLIC_PAGES = ['/auth', '/accept-invitation'];

// Pages that can be accessed by both authenticated and non-authenticated users
export const MIXED_ACCESS_PAGES = ['/verification'];

// Helper functions
export const getPublicRoutes = () => 
  Object.values(ROUTES).filter(route => route.isPublic);

export const getProtectedRoutes = () => 
  Object.values(ROUTES).filter(route => !route.isPublic);

export const getSidebarRoutes = (isAuthenticated: boolean, userRole?: string) => 
  Object.values(ROUTES).filter(route => {
    // Must be visible in sidebar
    if (!route.showInSidebar) return false;
    
    // Public routes are always visible
    if (route.isPublic) return true;
    
    // Private routes require authentication
    if (!isAuthenticated) return false;
    
    // Check role requirements
    if (route.requiredRoles && userRole) {
      return route.requiredRoles.includes(userRole);
    }
    
    // If no role requirements, show to all authenticated users
    return true;
  });

export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return Object.values(ROUTES).find(route => route.path === path);
};

// Page header configuration
export const PAGE_HEADER_CONFIG: Record<string, { showHeader: boolean; showBreadcrumbs: boolean; simplified?: boolean }> = {};

// Populate header config from routes
Object.values(ROUTES).forEach(route => {
  PAGE_HEADER_CONFIG[route.path] = {
    showHeader: route.showHeader,
    showBreadcrumbs: route.showBreadcrumbs,
    simplified: route.simplified,
  };
});

// Default configuration for pages not explicitly listed
export const DEFAULT_HEADER_CONFIG = { 
  showHeader: true, 
  showBreadcrumbs: true,
  simplified: false
};