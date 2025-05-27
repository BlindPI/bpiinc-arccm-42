
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
  "/certificates",
  "/courses",
  "/locations",
  "/analytics",
  "/automation",
  "/integrations", 
  "/reports",
  "/settings"
];
