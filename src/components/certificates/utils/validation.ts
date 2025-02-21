
import { VALID_CPR_LEVELS, VALID_FIRST_AID_LEVELS } from '../constants';
import { RowData } from '../types';

export const validateRowData = (rowData: RowData, rowIndex: number, selectedCourse: { name: string; expiration_months: number } | null) => {
  const errors: string[] = [];

  if (!rowData['Student Name']?.toString().trim()) {
    errors.push(`Row ${rowIndex + 1}: Student name is required`);
  }

  if (!selectedCourse) {
    errors.push(`Row ${rowIndex + 1}: Valid course must be selected`);
  }

  const assessmentStatus = rowData['Pass/Fail']?.toString().trim().toUpperCase();
  if (assessmentStatus && !['PASS', 'FAIL'].includes(assessmentStatus)) {
    errors.push(`Row ${rowIndex + 1}: Pass/Fail must be either PASS or FAIL`);
  }

  const phone = rowData['Phone']?.toString().trim();
  if (phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) {
    errors.push(`Row ${rowIndex + 1}: Phone number format should be (XXX) XXX-XXXX`);
  }

  const email = rowData['Email']?.toString().trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`Row ${rowIndex + 1}: Invalid email format`);
  }

  const cprLevel = rowData['CPR Level']?.toString().trim();
  if (cprLevel && !VALID_CPR_LEVELS.includes(cprLevel)) {
    errors.push(`Row ${rowIndex + 1}: Invalid CPR Level. Must be one of: ${VALID_CPR_LEVELS.join(', ')}`);
  }

  const firstAidLevel = rowData['First Aid Level']?.toString().trim();
  if (firstAidLevel && !VALID_FIRST_AID_LEVELS.includes(firstAidLevel)) {
    errors.push(`Row ${rowIndex + 1}: Invalid First Aid Level. Must be one of: ${VALID_FIRST_AID_LEVELS.join(', ')}`);
  }

  return errors;
};
