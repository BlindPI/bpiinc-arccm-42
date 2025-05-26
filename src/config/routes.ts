
import {
  Home,
  LayoutDashboard,
  Settings,
  User,
  Users,
  Calendar,
  Building2,
  Contact2,
  ListChecks,
  Bell,
  Mail,
  Book,
  GraduationCap,
  ShieldAlert,
  LucideIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  ListOrdered,
  File,
  FilePlus2,
  UserPlus2,
  KeyRound,
  HelpCircle,
  MessageSquare,
  PlusSquare,
  KanbanSquare,
  Package,
  FileSearch2,
  FileDown,
  FileSignature,
  ScrollText,
  Scroll,
  ClipboardList,
  ClipboardCheck,
  ClipboardCopy,
  ClipboardEdit,
  ClipboardPaste,
  ClipboardX,
  MapPin,
  LogIn,
  Search
} from "lucide-react";

type Route = {
  path: string;
  name: string;
  icon: LucideIcon;
  children?: Route[];
};

export const ROUTES = {
  DASHBOARD: '/',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  USERS: '/users',
  ROLES: '/roles',
  COURSES: '/courses',
  LOCATIONS: '/locations',
  CONTACTS: '/contacts',
  ENROLLMENTS: '/enrollments',
  COURSE_OFFERINGS: '/course-offerings',
  TEACHING_MANAGEMENT: '/teaching-management',
  NOTIFICATIONS: '/notifications',
  AUTH: '/auth',
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  PASSWORD_RESET: '/auth/password-reset',
  PASSWORD_FORGET: '/auth/password-forget',
  EMAIL_VERIFY: '/auth/email-verify',
  COMPLIANCE: '/compliance',
  CERTIFICATES: '/certificates',
  ROSTERS: '/rosters',
  REPORTS: '/reports',
  INSTRUCTORS: '/instructors',
  STUDENTS: '/students',
  PROVIDERS: '/providers',
  SYSTEM_ADMINS: '/system-admins',
  ADMINS: '/admins',
  INSTRUCTOR_TRAINEES: '/instructor-trainees',
  PROVISIONAL_INSTRUCTORS: '/provisional-instructors',
  AUTHORIZED_PROVIDERS: '/authorized-providers',
  COURSE_SCHEDULING: '/course-scheduling',
} as const;

// Route categories for layout routing
export const ALWAYS_PUBLIC_PAGES = [
  "/landing",
  "/auth",
  "/auth/signin", 
  "/auth/signup",
  "/auth/password-reset",
  "/verification"
];

export const MIXED_ACCESS_PAGES = [
  "/",
  "/dashboard"
];

export const PROTECTED_PAGES = [
  "/profile",
  "/settings",
  "/users",
  "/courses",
  "/locations",
  "/enrollments",
  "/course-scheduling",
  "/teaching-management",
  "/certifications",
  "/role-management"
];

// Sidebar route configuration
interface SidebarRoute {
  title: string;
  path: string;
  icon?: LucideIcon;
}

export const getSidebarRoutes = (isAuthenticated: boolean): SidebarRoute[] => {
  if (!isAuthenticated) {
    return [
      {
        title: "Home",
        path: "/landing",
        icon: Home
      },
      {
        title: "Certificate Verification", 
        path: "/verification",
        icon: BadgeCheck
      }
    ];
  }

  return [
    {
      title: "Dashboard",
      path: "/",
      icon: LayoutDashboard
    },
    {
      title: "Profile",
      path: "/profile", 
      icon: User
    },
    {
      title: "Settings",
      path: "/settings",
      icon: Settings
    }
  ];
};
