
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { processExcelFile, extractDataFromFile } from '../utils/fileProcessing';
import { findBestCourseMatch } from '../utils/courseMatching';
import { validateRowData } from '../utils/validation';
import { Course } from '@/types/courses';
import { useCertificationLevelsCache } from '@/hooks/useCertificationLevelsCache';
import { addMonths, format } from 'date-fns';
import {
  processAssessmentStatus,
  type AssessmentProcessingResult,
  type AssessmentWarning,
  DEFAULT_ASSESSMENT_CONFIG
} from '../utils/assessmentStatusProcessor';

// Helper functions
function formatDate(dateInput: any): string {
  try {
    if (!dateInput) return '';
    
    // Handle Excel dates (numbers)
    if (typeof dateInput === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch);
      date.setDate(excelEpoch.getDate() + dateInput);
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates in various formats
    if (typeof dateInput === 'string') {
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

function addMonthsToDate(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

// Import centralized assessment processor (already imported above)

function determineAssessmentStatus(row: any): {
  status: string;
  warnings: AssessmentWarning[];
  wasGradeConversion: boolean;
  wasDefaulted: boolean;
} {
  const result = processAssessmentStatus(row, DEFAULT_ASSESSMENT_CONFIG);
  return {
    status: result.status,
    warnings: result.warnings,
    wasGradeConversion: result.wasGradeConversion,
    wasDefaulted: result.wasDefaulted
  };
}

export function useFileProcessor() {
  const { 
    setProcessingStatus, 
    setProcessedData,
    setIsProcessingFile,
    enableCourseMatching,
    setExtractedCourse,
    setHasCourseMatches,
    selectedCourseId,
    setCurrentStep
  } = useBatchUpload();
  const { data: courses } = useCourseData();
  const { getAllCertificationTypes } = useCertificationLevelsCache();

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
        
        // Move to review step after successful processing
        setCurrentStep('REVIEW');
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
        totalCount: 0, // Will be updated based on non-empty rows
        errorCount: 0,
        courseMismatches: 0
      };
      
      let successCount = 0;
      let failCount = 0;
      let status = {
        processed: 0,
        successful: 0,
        failed: 0,
        total: 0, // Will be updated based on non-empty rows
        errors: [] as string[]
      };
      
      setProcessingStatus(status);

      // Get all available certification types
      const certificationTypes = getAllCertificationTypes();
      console.log('Available certification types:', certificationTypes);

      // Look for potential course info in the extracted data
      let extractedCourse = null;
      if (extractedData.courseInfo) {
        extractedCourse = extractedData.courseInfo;
        console.log('Extracted course info:', extractedCourse);
      }
      
      let hasCourseMatches = false;

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;
        
        // Skip empty rows - check if student name is empty or row is completely empty
        const studentName = (row['Student Name'] || row['NAME'] || row['Name'] || '').toString().trim();
        const email = (row['Email'] || row['EMAIL'] || row['email'] || '').toString().trim();
        
        // Skip if no name or if row appears to be completely empty
        if (!studentName || (!studentName && !email && Object.values(row).every(val => !val || val.toString().trim() === ''))) {
          console.log(`Skipping empty row ${rowNum}`);
          continue;
        }
        
        try {
          status.processed++;
          setProcessingStatus({ ...status });

          // Process assessment status with warnings
          const assessmentResult = determineAssessmentStatus(row);
          
          // Extract and standardize all fields with comprehensive mapping
          const processedRow = {
            name: studentName,
            email: (row['Email'] || row['EMAIL'] || row['email'] || '').toString().trim(),
            phone: (row['Phone'] || row['PHONE'] || row['phone'] || '').toString().trim(),
            company: (row['Company'] || row['COMPANY'] || row['Organization'] || row['company'] || '').toString().trim(),
            firstAidLevel: (row['First Aid Level'] || row['FIRST'] || row['First Aid'] || row['first_aid_level'] || '').toString().trim(),
            cprLevel: (row['CPR Level'] || row['CPR'] || row['cpr_level'] || '').toString().trim(),
            courseLength: parseFloat(
              row['Length']?.toString() ||
              row['HOURS']?.toString() ||
              row['Hours']?.toString() ||
              row['Course Hours']?.toString() ||
              '0'
            ) || 0,
            issueDate: extractedData.issueDate || formatDate(
              row['Issue Date'] ||
              row['ISSUE'] ||
              row['Completion Date'] ||
              row['issue_date'] ||
              new Date()
            ),
            expiryDate: row['Expiry Date'] || row['expiry_date'] ? formatDate(row['Expiry Date'] || row['expiry_date']) : '',
            city: (row['City'] || row['CITY'] || row['Location'] || row['city'] || '').toString().trim(),
            province: (row['Province'] || row['PROVINCE'] || row['State'] || row['province'] || '').toString().trim(),
            postalCode: (row['Postal Code'] || row['POSTAL'] || row['Zip Code'] || row['postal_code'] || '').toString().trim(),
            instructorName: (row['Instructor Name'] || row['INSTRUCTOR_NAME'] || row['Instructor'] || row['instructor_name'] || '').toString().trim(),
            instructorLevel: (row['Instructor Level'] || row['Instructor Type'] || row['instructor_level'] || '').toString().trim(),
            notes: (row['Notes'] || row['NOTES'] || row['notes'] || row['Comments'] || row['comments'] || '').toString().trim(),
            assessmentStatus: assessmentResult.status,
            assessmentWarnings: assessmentResult.warnings,
            wasGradeConversion: assessmentResult.wasGradeConversion,
            wasAssessmentDefaulted: assessmentResult.wasDefaulted,
            rowNum,
            isProcessed: false,
            error: '',
            courseMatches: [] as any[],
            certifications: {} as Record<string, string>,
            validationErrors: [] as string[]
          };

          // Map standard fields to the certification types
          if (processedRow.firstAidLevel) {
            processedRow.certifications['FIRST_AID'] = processedRow.firstAidLevel;
          }
          
          if (processedRow.cprLevel) {
            processedRow.certifications['CPR'] = processedRow.cprLevel;
          }

          // Validate required fields using centralized validation
          const rowDataForValidation = {
            'Student Name': processedRow.name,
            'Email': processedRow.email,
            'Phone': processedRow.phone,
            'Company': processedRow.company,
            'Assessment Status': processedRow.assessmentStatus,
            'FIRST_AID_LEVEL': processedRow.firstAidLevel,
            'CPR_LEVEL': processedRow.cprLevel
          };

          const validationErrors = validateRowData(rowDataForValidation, i, {
            name: 'Selected Course',
            expiration_months: 12
          });

          processedRow.validationErrors = validationErrors;

          // Only throw if there are validation errors
          if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
          }

          // Use proper course matching logic
          if (enableCourseMatching && courses) {
            try {
              const courseMatch = await findBestCourseMatch(
                {
                  firstAidLevel: processedRow.firstAidLevel,
                  cprLevel: processedRow.cprLevel
                },
                selectedCourseId || 'default',
                courses as Course[]
              );
              
              if (courseMatch && courseMatch.matchType !== 'mismatch') {
                hasCourseMatches = true;
                processedRow.courseMatches = [{
                  courseId: courseMatch.id,
                  courseName: courseMatch.name,
                  matchType: courseMatch.matchType,
                  confidence: courseMatch.matchType === 'exact' ? 100 : 80,
                  certifications: courseMatch.certifications || [],
                  expirationMonths: courseMatch.expiration_months
                }];
                console.log(`✓ Course match found for row ${rowNum}: ${courseMatch.name} (${courseMatch.matchType})`);
              } else {
                console.log(`❌ No course match for row ${rowNum}: FirstAid="${processedRow.firstAidLevel}", CPR="${processedRow.cprLevel}"`);
                if (courseMatch?.mismatchReason) {
                  processedRow.validationErrors.push(`Course matching: ${courseMatch.mismatchReason}`);
                }
              }
            } catch (error) {
              console.error(`Course matching error for row ${rowNum}:`, error);
              processedRow.validationErrors.push(`Course matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else if (selectedCourseId && selectedCourseId !== 'none' && courses) {
            // Use manually selected course
            const selectedCourse = courses.find(c => c.id === selectedCourseId);
            if (selectedCourse) {
              processedRow.courseMatches = [{
                courseId: selectedCourse.id,
                courseName: selectedCourse.name,
                matchType: 'manual',
                confidence: 100,
                certifications: [],
                expirationMonths: selectedCourse.expiration_months
              }];
            }
          }

          // Calculate expiry date if not provided and we have course info
          if (!processedRow.expiryDate && processedRow.courseMatches?.length > 0 && processedRow.courseMatches[0].courseId) {
            // Find the course by ID
            const coursesForExpiryCalc = courses as unknown as Course[];
            const matchedCourse = coursesForExpiryCalc?.find(c => c.id === processedRow.courseMatches[0].courseId);
            
            if (matchedCourse?.expiration_months) {
              try {
                const issueDate = new Date(processedRow.issueDate);
                if (!isNaN(issueDate.getTime())) {
                  const expiryDate = addMonthsToDate(issueDate, matchedCourse.expiration_months);
                  processedRow.expiryDate = format(expiryDate, 'yyyy-MM-dd');
                  console.log(`Calculated expiry date for row ${rowNum}: ${processedRow.expiryDate}`);
                } else {
                  // If issue date is invalid, set a default expiry date (today plus expiration months)
                  const expiryDate = addMonthsToDate(new Date(), matchedCourse.expiration_months);
                  processedRow.expiryDate = format(expiryDate, 'yyyy-MM-dd');
                  console.log(`Using default expiry date for row ${rowNum}: ${processedRow.expiryDate}`);
                }
              } catch (e) {
                console.error('Error calculating expiry date:', e);
                // Fallback: set expiry date to 2 years from today
                const today = new Date();
                const twoYearsFromNow = addMonthsToDate(today, 24);
                processedRow.expiryDate = format(twoYearsFromNow, 'yyyy-MM-dd');
              }
            } else {
              // If no expiration_months found, set default to 2 years
              const today = new Date(processedRow.issueDate);
              const twoYearsFromNow = addMonthsToDate(
                isNaN(today.getTime()) ? new Date() : today, 
                24
              );
              processedRow.expiryDate = format(twoYearsFromNow, 'yyyy-MM-dd');
            }
          }

          // If we still don't have an expiry date, set a default one (2 years from issue date)
          if (!processedRow.expiryDate) {
            try {
              const issueDate = new Date(processedRow.issueDate);
              const defaultExpiryDate = isNaN(issueDate.getTime()) 
                ? addMonthsToDate(new Date(), 24)
                : addMonthsToDate(issueDate, 24);
              processedRow.expiryDate = format(defaultExpiryDate, 'yyyy-MM-dd');
              console.log(`Set default expiry date for row ${rowNum}: ${processedRow.expiryDate}`);
            } catch (e) {
              console.error('Error setting default expiry date:', e);
              processedRow.expiryDate = format(addMonthsToDate(new Date(), 24), 'yyyy-MM-dd');
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
            courseMatches: [],
            validationErrors: [error instanceof Error ? error.message : 'Unknown error']
          });
          
          processedData.errorCount++;
        }
        
        setProcessingStatus({ ...status });
      }

      // Update total count to reflect actually processed rows
      processedData.totalCount = processedData.data.length;
      status.total = processedData.data.length;
      
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
