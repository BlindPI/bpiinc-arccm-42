import * as XLSX from 'xlsx';
import { findBestCourseMatch, validateCourseMatch } from './courseMatching';
import type { Course } from '@/types/courses';
import type { ProcessedData } from '@/types/batch-upload';

function cleanString(str: any): string {
  if (typeof str === 'number') {
    return String(str).trim();
  }
  if (typeof str === 'string') {
    return str.trim();
  }
  return '';
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // Handle Excel date serial numbers
  if (typeof dateValue === 'number') {
    const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
    return excelDate.toISOString().split('T')[0];
  }
  
  // Handle string dates
  if (typeof dateValue === 'string') {
    const cleanDate = dateValue.trim();
    if (!cleanDate) return '';
    
    // Try parsing various formats
    let parsedDate: Date | null = null;
    
    // Try MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
      const [month, day, year] = cleanDate.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Try DD/MM/YYYY format
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Try YYYY-MM-DD format
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDate)) {
      parsedDate = new Date(cleanDate);
    }
    // Try direct parsing
    else {
      parsedDate = new Date(cleanDate);
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  }
  
  return '';
}

function calculateExpiryDate(issueDate: string, course: Course | null): string {
  if (!issueDate) return '';
  
  const issue = new Date(issueDate);
  if (isNaN(issue.getTime())) return '';
  
  // Get expiration months from course, default to 36 months
  const expirationMonths = course?.expiration_months || 36;
  
  const expiry = new Date(issue);
  expiry.setMonth(expiry.getMonth() + expirationMonths);
  
  return expiry.toISOString().split('T')[0];
}

export async function processRosterFile(
  file: File,
  courses: Course[],
  enableCourseMatching: boolean = false,
  selectedCourseId?: string
): Promise<ProcessedData> {
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    let errorCount = 0;
    const processedRows = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i];
      const rowNumber = i + 2; // Excel row number (1-indexed + header)
      
      // Extract and format completion date
      const rawIssueDate = row['Completion Date'] || row['Issue Date'] || row['Date'] || '';
      const formattedIssueDate = formatDate(rawIssueDate) || new Date().toISOString().split('T')[0]; // Default to today

      const processedRow = {
        id: `temp-${i}`,
        recipientName: cleanString(row['Name'] || row['Student Name'] || row['Recipient Name'] || ''),
        email: cleanString(row['Email'] || row['Email Address'] || ''),
        phone: cleanString(row['Phone'] || row['Phone Number'] || ''),
        company: cleanString(row['Company'] || row['Organization'] || ''),
        firstAidLevel: cleanString(row['First Aid Level'] || row['First Aid'] || ''),
        cprLevel: cleanString(row['CPR Level'] || row['CPR'] || ''),
        courseName: cleanString(row['Course'] || row['Course Name'] || ''),
        assessmentStatus: (row['Assessment'] || row['Status'] || 'PASS').toString().toUpperCase(),
        issueDate: formattedIssueDate,
        expiryDate: '', // Will be calculated after course matching
        validationErrors: [] as any[],
        courseMatch: null as any,
        courseMatches: [] as any[],
        hasCourseMismatch: false,
        rowNumber
      };

      // Basic validation
      if (!processedRow.recipientName) {
        processedRow.validationErrors.push({
          type: 'required',
          field: 'recipientName',
          message: `Row ${rowNumber}: Name is required`
        });
      }

      if (!processedRow.email) {
        processedRow.validationErrors.push({
          type: 'required',
          field: 'email',
          message: `Row ${rowNumber}: Email is required`
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(processedRow.email)) {
        processedRow.validationErrors.push({
          type: 'invalid',
          field: 'email',
          message: `Row ${rowNumber}: Invalid email format`
        });
      }

      // CRITICAL: Course matching validation and expiry calculation
      let matchedCourse: Course | null = null;
      
      if (enableCourseMatching && (processedRow.firstAidLevel || processedRow.cprLevel)) {
        const courseMatch = await findBestCourseMatch(
          {
            firstAidLevel: processedRow.firstAidLevel,
            cprLevel: processedRow.cprLevel
          },
          selectedCourseId || 'default',
          courses
        );

        processedRow.courseMatch = courseMatch;
        processedRow.courseMatches = courseMatch ? [courseMatch] : [];
        
        // Find the actual course object for expiry calculation
        if (courseMatch && courseMatch.id) {
          matchedCourse = courses.find(c => c.id === courseMatch.id) || null;
        }
        
        // Validate the course match
        const validation = validateCourseMatch(courseMatch);
        if (!validation.isValid) {
          processedRow.hasCourseMismatch = true;
          processedRow.validationErrors.push({
            type: 'course_mismatch',
            field: 'course',
            message: `Row ${rowNumber}: ${validation.error}`,
            details: {
              specifiedFirstAid: processedRow.firstAidLevel,
              specifiedCpr: processedRow.cprLevel,
              availableCourses: courses
                .filter(c => c.status === 'ACTIVE')
                .map(c => ({
                  name: c.name,
                  firstAid: c.first_aid_level,
                  cpr: c.cpr_level
                }))
                .slice(0, 5) // Show first 5 for reference
            }
          });
        }
      } else if (selectedCourseId && selectedCourseId !== 'none') {
        // Use selected course if no matching enabled
        matchedCourse = courses.find(c => c.id === selectedCourseId) || null;
        if (matchedCourse) {
          processedRow.courseMatches = [{
            id: matchedCourse.id,
            name: matchedCourse.name,
            matchType: 'manual' as const,
            expiration_months: matchedCourse.expiration_months || 36,
            certifications: []
          }];
        }
      }
      
      // Calculate expiry date based on matched course
      processedRow.expiryDate = calculateExpiryDate(processedRow.issueDate, matchedCourse);

      if (processedRow.validationErrors.length > 0) {
        errorCount++;
      }

      processedRows.push(processedRow);
    }

    return {
      data: processedRows,
      totalCount: processedRows.length,
      errorCount
    };

  } catch (error) {
    console.error('Error processing roster file:', error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
