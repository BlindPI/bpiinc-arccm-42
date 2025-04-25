
// Required columns for roster files
export const REQUIRED_COLUMNS = new Set([
  'Student Name',
  'Email'
]);

// Optional columns that are expected in the roster files
export const OPTIONAL_COLUMNS = new Set([
  'Phone',
  'Company',
  'City',
  'Province',
  'Postal Code',
  'First Aid Level',
  'CPR Level',
  'Assessment Status',
  'Length'
]);

// Valid First Aid Levels
export const VALID_FIRST_AID_LEVELS = [
  'Standard First Aid',
  'Emergency First Aid'
];

// Valid CPR Levels
export const VALID_CPR_LEVELS = [
  'CPR A',
  'CPR A w/AED',
  'CPR C',
  'CPR C w/AED',
  'CPR BLS',
  'CPR BLS w/AED'
];
