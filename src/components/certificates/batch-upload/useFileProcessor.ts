
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { processExcelFile, extractDataFromFile } from '../utils/fileProcessing';
import { findMatchingCourse } from './useCourseMatching';

export function useFileProcessor() {
  const { 
    setProcessingStatus, 
    setProcessedData,
    setIsProcessingFile,
    enableCourseMatching,
    setExtractedCourse,
    setHasCourseMatches
  } = useBatchUpload();
  const { data: courses } = useCourseData();

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    setProcessingStatus({
      processed: 0,
      successful: 0,
      failed: 0,
      total: 0,
      errors: []
    });

    try {
      // Use different processing based on file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx') {
        // Process the Excel file
        const processedRows = await processExcelFile(file);
        console.log('Processed rows from file:', processedRows);
        
        // Extract course info from the file
        const extractedData = extractDataFromFile(processedRows);
        console.log('Extracted data:', extractedData);
        
        await processDataFromFile(processedRows, extractedData);
      } else {
        toast.error('Unsupported file format. Please use XLSX.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processDataFromFile = async (data: Record<string, any>[], extractedData: any) => {
    try {
      if (!data || data.length === 0) {
        toast.error('No data found in the file');
        return;
      }

      // Process data rows
      const processedData = { 
        data: [] as any[], 
        totalCount: data.length,
        errorCount: 0
      };
      
      let successCount = 0;
      let failCount = 0;
      let status = {
        processed: 0,
        successful: 0,
        failed: 0,
        total: data.length,
        errors: [] as string[]
      };
      
      setProcessingStatus(status);

      // Look for potential course info in the extracted data
      let extractedCourse = null;
      if (extractedData.courseInfo) {
        extractedCourse = await findMatchingCourse({
          firstAidLevel: extractedData.courseInfo.firstAidLevel,
          cprLevel: extractedData.courseInfo.cprLevel,
          courseLength: extractedData.courseInfo.length
        }, courses);
      }
      
      let courseMatches: Record<string, any> = {};
      let hasCourseMatches = false;

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;
        try {
          status.processed++;
          setProcessingStatus({ ...status });

          // Extract and standardize fields
          const processedRow = {
            name: (row['Student Name'] || '').toString().trim(),
            email: (row['Email'] || '').toString().trim(),
            phone: (row['Phone'] || '').toString().trim(),
            company: (row['Company'] || row['Organization'] || '').toString().trim(),
            firstAidLevel: (row['First Aid Level'] || '').toString().trim(),
            cprLevel: (row['CPR Level'] || '').toString().trim(),
            courseLength: parseFloat(row['Length']?.toString() || '0') || 0,
            issueDate: extractedData.issueDate || formatDate(row['Issue Date'] || new Date()),
            expiryDate: row['Expiry Date'] || '',
            city: (row['City'] || row['Location'] || '').toString().trim(),
            province: (row['Province'] || row['State'] || '').toString().trim(),
            postalCode: (row['Postal Code'] || row['Zip Code'] || '').toString().trim(),
            assessmentStatus: determineAssessmentStatus(row),
            rowNum,
            isProcessed: false,
            error: '',
            courseMatches: [] as any[]
          };

          // Validate required fields
          if (!processedRow.name) {
            throw new Error('Name is required');
          }

          if (!processedRow.email) {
            throw new Error('Email is required');
          }

          // Find matching course if enabled
          if (enableCourseMatching) {
            // Get course matches for this row if it has course information
            let rowCourseInfo = {
              firstAidLevel: processedRow.firstAidLevel,
              cprLevel: processedRow.cprLevel,
              courseLength: processedRow.courseLength
            };

            // If this row has course info and we don't have an extracted course yet
            if ((rowCourseInfo.firstAidLevel || rowCourseInfo.cprLevel || rowCourseInfo.courseLength) && !extractedCourse) {
              extractedCourse = await findMatchingCourse(rowCourseInfo, courses);
            }

            // Find matches for this specific row
            if (courses) {
              const key = `${processedRow.firstAidLevel}-${processedRow.cprLevel}-${processedRow.courseLength}`;
              
              // Cache course matches to avoid multiple lookups for the same info
              if (!courseMatches[key]) {
                const matches = findBestMatchingCourse(rowCourseInfo, courses);
                
                if (matches) {
                  courseMatches[key] = matches;
                  hasCourseMatches = true;
                  processedRow.courseMatches = [matches];
                }
              } else {
                processedRow.courseMatches = [courseMatches[key]];
              }
            }
          }

          // Calculate expiry date if not provided and we have course info
          if (!processedRow.expiryDate && extractedCourse?.expirationMonths) {
            try {
              const issueDate = new Date(processedRow.issueDate);
              const expiryDate = addMonths(issueDate, extractedCourse.expirationMonths);
              processedRow.expiryDate = formatDate(expiryDate);
            } catch (e) {
              console.error('Error calculating expiry date:', e);
            }
          }

          processedRow.isProcessed = true;
          successCount++;
          status.successful++;

          processedData.data.push(processedRow);

        } catch (error) {
          console.error(`Error processing row ${rowNum}:`, error);
          failCount++;
          status.failed++;
          
          // Add the error message to the errors array
          const errorMessage = `Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          status.errors.push(errorMessage);
          
          processedData.data.push({
            name: (row['Student Name'] || '').toString(),
            email: (row['Email'] || '').toString(),
            rowNum,
            isProcessed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            courseMatches: []
          });
          
          processedData.errorCount++;
        }
        
        setProcessingStatus({ ...status });
      }

      // Set the processed data and extracted course
      setProcessedData(processedData);
      setExtractedCourse(extractedCourse);
      setHasCourseMatches(hasCourseMatches);
      
      if (failCount > 0) {
        toast.warning(`Processed ${data.length} records with ${failCount} errors. Please review and fix any issues.`);
      } else {
        toast.success(`Successfully processed ${successCount} records.`);
      }

    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast.error(`Error processing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return { processFile };
}

// Helper functions
function formatDate(dateInput: any): string {
  try {
    if (!dateInput) return '';
    
    // Handle Excel dates (numbers)
    if (typeof dateInput === 'number') {
      // Excel dates are days since 1899-12-30
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch);
      date.setDate(excelEpoch.getDate() + dateInput);
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates in various formats
    if (typeof dateInput === 'string') {
      // Try direct parsing first
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Handle Date objects
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    
    // Default to today if we can't parse
    return new Date().toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting date:', e);
    return new Date().toISOString().split('T')[0];
  }
}

function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

function determineAssessmentStatus(row: any): string {
  const assessmentField = row['assessment'] || row['Assessment'] || row['assessment_status'] || row['Assessment Status'] || row['Pass/Fail'] || '';
  
  if (!assessmentField) return 'PASS'; // Default to pass if not specified
  
  const status = String(assessmentField).trim().toUpperCase();
  
  if (status === 'FAIL' || status === 'FAILED') {
    return 'FAIL';
  } else if (status === 'PENDING' || status === 'NOT ASSESSED') {
    return 'PENDING';
  }
  
  return 'PASS'; // Default to pass for any other value
}

function findBestMatchingCourse(courseInfo: { 
  firstAidLevel?: string, 
  cprLevel?: string, 
  courseLength?: number 
}, courses: any[] | undefined) {
  if (!courses) return null;
  
  // Find exact matches first
  const exactMatches = courses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    const lengthMatch = courseInfo.courseLength && course.length && 
      courseInfo.courseLength === course.length;
    
    return (firstAidMatch && cprMatch) || (firstAidMatch && lengthMatch) || (cprMatch && lengthMatch);
  });
  
  if (exactMatches.length > 0) {
    return {
      courseId: exactMatches[0].id,
      courseName: exactMatches[0].name,
      confidence: 90
    };
  }
  
  // Find partial matches if no exact match
  const partialMatches = courses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      (courseInfo.firstAidLevel.toLowerCase().includes(course.first_aid_level.toLowerCase()) || 
       course.first_aid_level.toLowerCase().includes(courseInfo.firstAidLevel.toLowerCase()));
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      (courseInfo.cprLevel.toLowerCase().includes(course.cpr_level.toLowerCase()) || 
       course.cpr_level.toLowerCase().includes(courseInfo.cprLevel.toLowerCase()));
    
    return firstAidMatch || cprMatch;
  });
  
  if (partialMatches.length > 0) {
    return {
      courseId: partialMatches[0].id,
      courseName: partialMatches[0].name,
      confidence: 70
    };
  }
  
  return null;
}
