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
        validationErrors: [] as any[],
        courseMatch: null as any,
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

      // CRITICAL: Course matching validation
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
      }

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
