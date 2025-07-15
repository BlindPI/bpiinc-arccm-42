import * as XLSX from 'xlsx';
import { findBestCourseMatch, validateCourseMatch } from './courseMatching';
import type { Course } from '@/types/courses';
import type { CourseMatch } from '../types';

export interface ProcessedRow {
  [key: string]: any;
  courseMatch?: CourseMatch | null;
  hasError?: boolean;
  errors?: string[];
}

export interface ExtractedData {
  totalRows: number;
  validRows: number;
  courseMismatches: number;
  errors: string[];
}

export async function processExcelFile(file: File): Promise<ProcessedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Empty file'));
          return;
        }
        
        // Convert to object array with proper headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: any[]) => {
          const obj: ProcessedRow = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export function extractDataFromFile(processedRows: ProcessedRow[]): ExtractedData {
  const errors: string[] = [];
  let validRows = 0;
  let courseMismatches = 0;
  
  processedRows.forEach((row, index) => {
    // Basic validation - check if required fields exist
    const requiredFields = ['Student Name', 'Email'];
    const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
    
    if (missingFields.length === 0 && !row.hasError) {
      validRows++;
    } else {
      if (row.errors) {
        errors.push(...row.errors);
      }
      if (missingFields.length > 0) {
        errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
      }
    }
    
    // Count course mismatches
    if (row.courseMatch?.matchType === 'mismatch') {
      courseMismatches++;
    }
  });
  
  return {
    totalRows: processedRows.length,
    validRows,
    courseMismatches,
    errors
  };
}

export interface ProcessedData {
  data: ProcessedRow[];
  totalCount: number;
  errorCount: number;
  courseMismatches: number;
}

export async function processRosterFile(
  file: File, 
  courses: Course[] = [], 
  enableCourseMatching: boolean = false, 
  selectedCourseId?: string
): Promise<ProcessedData> {
  const processedRows = await processExcelFile(file);
  
  // Apply course matching if enabled
  if (enableCourseMatching && courses.length > 0) {
    console.log('Applying course matching to', processedRows.length, 'rows');
    
    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i];
      
      // Extract course information from row
      const courseInfo = {
        firstAidLevel: row['First Aid Level'] || '',
        cprLevel: row['CPR Level'] || ''
      };
      
      try {
        // Find course match
        const courseMatch = await findBestCourseMatch(
          courseInfo,
          selectedCourseId || '',
          courses
        );
        
        row.courseMatch = courseMatch;
        
        // Validate course match
        const validation = validateCourseMatch(courseMatch);
        if (!validation.isValid) {
          row.hasError = true;
          row.hasCourseMismatch = true;
          row.errors = row.errors || [];
          row.errors.push(`Row ${i + 2}: ${validation.error}`);
        }
        
      } catch (error) {
        console.error('Course matching error for row', i + 2, ':', error);
        row.hasError = true;
        row.hasCourseMismatch = true;
        row.errors = row.errors || [];
        row.errors.push(`Row ${i + 2}: Course matching failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else if (selectedCourseId) {
    // Use selected course as default for all rows
    const defaultCourse = courses.find(c => c.id === selectedCourseId);
    if (defaultCourse) {
      console.log('Using default course for all rows:', defaultCourse.name);
      processedRows.forEach(row => {
        row.courseMatch = {
          id: defaultCourse.id,
          name: defaultCourse.name,
          matchType: 'default',
          expiration_months: defaultCourse.expiration_months,
          certifications: []
        };
      });
    }
  }
  
  const extractedData = extractDataFromFile(processedRows);
  
  return {
    data: processedRows,
    totalCount: extractedData.totalRows,
    errorCount: extractedData.totalRows - extractedData.validRows,
    courseMismatches: extractedData.courseMismatches
  };
}