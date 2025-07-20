
import { VALID_CPR_LEVELS, VALID_FIRST_AID_LEVELS, REQUIRED_COLUMNS } from '../constants';
import { RowData } from '../types';

export const validateRowData = (rowData: RowData, rowIndex: number, selectedCourse: { name: string; expiration_months: number } | null) => {
  const errors: string[] = [];

  // First, validate all required fields are present and non-empty
  for (const field of REQUIRED_COLUMNS) {
    if (!rowData[field]?.toString().trim()) {
      const fieldName = field === 'Student Name' ? 'Student name' : field;
      errors.push(`Row ${rowIndex + 1}: ${fieldName} is required`);
    }
  }

  // Course validation removed - handled by course matching logic
  // Assessment status validation removed - handled by assessment processor
  // Phone validation removed - should accept any reasonable phone format for batch uploads

  // Format validation for fields that are present and non-empty
  const email = rowData['Email']?.toString().trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`Row ${rowIndex + 1}: Invalid email format`);
  }

  // CPR and First Aid levels should be validated against courses table, not hardcoded lists
  // This validation is handled by course matching logic

  return errors;
};
