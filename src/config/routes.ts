
import { CheckCircle } from 'lucide-react';

export const ALWAYS_PUBLIC_PAGES = [
  "/landing",
  "/auth",
  "/auth/signin", 
  "/auth/signup",
  "/accept-invitation"
];

export const MIXED_ACCESS_PAGES = [
  "/",
  "/dashboard",
  "/verification"  // Moved from ALWAYS_PUBLIC_PAGES for seamless navigation
];

export const PROTECTED_PAGES = [
  "/courses",
  "/locations", 
  "/user-management",
  "/profile",
  "/supervision",
  "/settings",
  "/certifications",
  "/role-management",
  "/progression-paths",
  "/certificate-analytics"
];

// Navigation items for different user states
export const getSidebarRoutes = (isAuthenticated: boolean) => {
  if (!isAuthenticated) {
    return [
      {
        title: "Certificate Verification",
        path: "/verification",
        icon: CheckCircle
      }
    ];
  }
  
  // Return empty array for authenticated users - AppSidebar handles this
  return [];
};

export const getPublicNavigationItems = () => [
  { title: "Home", path: "/landing" },
  { title: "Verify Certificate", path: "/verification" },
  { title: "Sign In", path: "/auth/signin" },
  { title: "Sign Up", path: "/auth/signup" }
];
