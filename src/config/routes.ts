
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
  "/enrollments",
  "/enrollment-management",
  "/training-hub",
  "/locations",
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
  // CRM Routes
  "/crm",
  "/crm/dashboard",
  "/crm/leads",
  "/crm/leads/create",
  "/crm/leads/my",
  "/crm/leads/unassigned",
  "/crm/leads/import",
  "/crm/opportunities",
  "/crm/opportunities/create",
  "/crm/opportunities/my",
  "/crm/opportunities/forecast",
  "/crm/opportunities/closed",
  "/crm/activities",
  "/crm/activities/tasks",
  "/crm/activities/calendar",
  "/crm/activities/log",
  "/crm/activities/followups",
  "/crm/activities/create",
  "/crm/campaigns",
  "/crm/campaigns/templates",
  "/crm/campaigns/analytics",
  "/crm/campaigns/create",
  "/crm/revenue",
  "/crm/revenue/commissions",
  "/crm/revenue/ap-performance",
  "/crm/revenue/reports",
  "/crm/settings",
  "/crm/settings/pipeline",
  "/crm/settings/scoring",
  "/crm/settings/assignment",
  "/crm/settings/analytics"
];
