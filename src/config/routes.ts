// Route configuration for the application
export const ALWAYS_PUBLIC_PAGES = [
  "/landing", 
  "/auth", 
  "/auth/signin", 
  "/auth/signup",
  "/reset-password"
];

export const MIXED_ACCESS_PAGES = [
  "/verify",
  "/accept-invitation"
];

export const PROTECTED_PAGES = [
  "/",
  "/dashboard",
  "/profile", 
  "/users",
  "/teams", // UNIFIED: Redirects to Training Hub
  "/enhanced-teams", // UNIFIED: Redirects to Training Hub
  "/role-management",
  "/supervision",
  "/certificates",
  "/certificate-analytics",
  "/rosters",
  "/courses", // RESTORED: Dedicated Course Management Page
  "/enrollments",
  "/enrollment-management",
  "/training-hub",
  "/training-management", // NEW: Unified Training Management System
  "/locations", // RESTORED: Dedicated Location Management Page
  "/analytics",
  "/executive-dashboard",
  "/report-scheduler",
  "/reports",
  "/automation",
  "/progression-path-builder",
  "/integrations",
  "/notifications",
  "/system-monitoring",
  "/settings",
  "/crm",
  "/crm/leads",
  "/crm/opportunities",
  "/crm/revenue",
  "/instructor-performance",
  "/authorized-providers"
];
