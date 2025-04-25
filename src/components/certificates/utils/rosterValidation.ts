
import { REQUIRED_COLUMNS } from '../constants';

export interface RosterEntry {
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  length?: number;
  issueDate: string;
  courseId: string;
  hasError: boolean;
  errors?: string[];
  rowIndex: number;
}

export function processRosterData(data: Record<string, any>[], selectedCourseId: string) {
  const processedData: RosterEntry[] = [];
  let errorCount = 0;
  
  data.forEach((row, index) => {
    const entry: Partial<RosterEntry> = {
      studentName: row['Student Name']?.trim() || '',
      email: row['Email']?.trim() || '',
      phone: row['Phone']?.trim() || '',
      company: row['Company']?.trim() || '',
      city: row['City']?.trim() || '',
      province: row['Province']?.trim() || '',
      postalCode: row['Postal Code']?.trim() || '',
      firstAidLevel: row['First Aid Level']?.trim() || '',
      cprLevel: row['CPR Level']?.trim() || '',
      assessmentStatus: row['Assessment Status']?.trim() || '',
      length: row['Length'] ? parseInt(row['Length']) : undefined,
      courseId: selectedCourseId,
      rowIndex: index,
      hasError: false,
      errors: []
    };
    
    // Validate required fields
    if (!entry.studentName) {
      entry.hasError = true;
      entry.errors?.push('Student Name is required');
    }
    
    if (!entry.email) {
      entry.hasError = true;
      entry.errors?.push('Email is required');
    } else if (!isValidEmail(entry.email)) {
      entry.hasError = true;
      entry.errors?.push('Email format is invalid');
    }

    // Validate length if provided
    if (entry.length !== undefined && isNaN(entry.length)) {
      entry.hasError = true;
      entry.errors?.push('Length must be a valid number');
    }
    
    // Increment error count if entry has errors
    if (entry.hasError) {
      errorCount++;
    }
    
    processedData.push(entry as RosterEntry);
  });
  
  return {
    processedData,
    totalCount: data.length,
    errorCount
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
