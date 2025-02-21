
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

export const VALID_CPR_LEVELS = [
  'CPR A',
  'CPR A w/AED',
  'CPR C',
  'CPR C w/AED',
  'CPR BLS',
  'CPR BLS w/AED'
] as const;

export const VALID_FIRST_AID_LEVELS = [
  'Standard First Aid',
  'Emergency First Aid',
  'Advanced'
] as const;
