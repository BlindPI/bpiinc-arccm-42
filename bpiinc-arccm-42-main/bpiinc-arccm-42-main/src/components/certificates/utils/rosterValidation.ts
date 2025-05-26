
import { CourseMatch } from '../types';

export interface RosterEntry {
  rowIndex: number;
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  instructorName?: string;
  length?: number; // Changed from string | number to number
  assessmentStatus?: 'PASS' | 'FAIL';
  hasError?: boolean;
  errors?: string[];
  courseId?: string;
  matchedCourse?: CourseMatch;
  issueDate?: string;
  expiryDate?: string;
}

// Process roster data from imported file
export function processRosterData(
  data: Record<string, any>[],
  defaultCourseId: string,
  issueDate: string
): {
  processedData: RosterEntry[];
  totalCount: number;
  errorCount: number;
} {
  const processedData: RosterEntry[] = [];
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const entry: RosterEntry = {
      rowIndex: i,
      studentName: row['Student Name'] || '',
      email: row['Email'] || '',
      phone: row['Phone'] || '',
      company: row['Company'] || row['Organization'] || '',
      city: row['City'] || '',
      province: row['Province'] || row['State'] || '',
      postalCode: row['Postal Code'] || row['Zip Code'] || row['ZIP'] || '',
      firstAidLevel: row['First Aid Level'] || '',
      cprLevel: row['CPR Level'] || '',
      instructorName: row['Instructor'] || '',
      length: row['Length'] ? Number(row['Length']) : undefined, // Convert to number
      assessmentStatus: (row['Pass/Fail'] || '').toUpperCase() === 'PASS' ? 'PASS' : 
                       (row['Pass/Fail'] || '').toUpperCase() === 'FAIL' ? 'FAIL' : undefined,
      courseId: defaultCourseId,
      issueDate: row['Issue Date'] || issueDate
    };

    // Validate required fields
    const errors: string[] = [];
    if (!entry.studentName) {
      errors.push(`Row ${i + 1}: Student name is required`);
    }
    if (entry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
      errors.push(`Row ${i + 1}: Invalid email format`);
    }

    if (errors.length > 0) {
      entry.hasError = true;
      entry.errors = errors;
      errorCount++;
    }

    processedData.push(entry);
  }

  return {
    processedData,
    totalCount: processedData.length,
    errorCount
  };
}
