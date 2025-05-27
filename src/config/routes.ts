
// Route configuration for the application
export const ALWAYS_PUBLIC_PAGES = [
  "/landing", 
  "/auth", 
  "/auth/signin", 
  "/auth/signup"
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
  "/teams",
  "/role-management",
  "/supervision",
  "/certificates",
  "/certificate-analytics",
  "/rosters",
  "/courses",
  "/course-scheduling",
  "/course-offerings",
  "/enrollments",
  "/enrollment-management",
  "/teaching-sessions",
  "/locations",
  "/analytics",
  "/executive-dashboard",
  "/instructor-performance",
  "/report-scheduler",
  "/reports",
  "/automation",
  "/progression-path-builder",
  "/integrations",
  "/notifications",
  "/system-monitoring",
  "/settings"
];
