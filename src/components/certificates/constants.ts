
export const REQUIRED_COLUMNS = [
  'Issue Date',
  'Student Name',
  'Email',
  'Phone',
  'Company',
  'First Aid Level',
  'CPR Level',
  'Pass/Fail',
  'City',
  'Province',
  'Postal Code',
  'Notes'
] as const;

export const VALID_CPR_LEVELS = ['A', 'B', 'C', 'HCP', 'BLS'] as const;
export const VALID_FIRST_AID_LEVELS = ['Emergency', 'Standard', 'Advanced'] as const;
