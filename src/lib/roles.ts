export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN';

export const ROLE_LABELS: Record<UserRole, string> = {
  SA: 'System Admin',
  AD: 'Administrator',
  AP: 'Authorized Provider',
  IC: 'Certified Instructor',
  IP: 'Provisional Instructor',
  IT: 'Instructor Trainee',
  IN: 'Instructor New'
};

export const ROLE_HIERARCHY: { [key in UserRole]: UserRole[] } = {
  'SA': ['AD', 'AP', 'IC', 'IP', 'IT', 'IN'],
  'AD': ['AP', 'IC', 'IP', 'IT', 'IN'],
  'AP': ['IC', 'IP', 'IT', 'IN'],
  'IC': ['IP', 'IT', 'IN'],
  'IP': ['IT', 'IN'],
  'IT': ['IN'],
  'IN': [],
};
