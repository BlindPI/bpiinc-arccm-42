import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { processExcelFile, extractDataFromFile } from '../utils/fileProcessing';
import { findBestCourseMatch } from '../utils/courseMatching';
import { Course } from '@/types/courses'; 
import { useCertificationLevelsCache } from '@/hooks/useCertificationLevelsCache';

export function useFileProcessor() {
  const { 
    setProcessingStatus, 
    setProcessedData,
    setIsProcessingFile,
    enableCourseMatching,
    setExtractedCourse,
    setHasCourseMatches,
    selectedCourseId
  } = useBatchUpload();
  const { data: courses } = useCourseData();
  const { getAllCertificationTypes, isCertificationLevel } = useCertificationLevelsCache();

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
        try {
          status.processed++;
          setProcessingStatus({ ...status });

          // Process first aid level and check for instructor info for this specific row
          let firstAidLevel = (row['First Aid Level'] || '').toString().trim();
          let instructorLevel = (row['Instructor Level'] || '').toString().trim();
          
          // Use the extractInstructorInfoFromFirstAid function from the imported fileProcessing module
          if (firstAidLevel) {
            const { extractInstructorInfoFromFirstAid } = require('../utils/fileProcessing');
            const extracted = extractInstructorInfoFromFirstAid(firstAidLevel);
            // Only update if we found instructor info
            if (extracted.instructorLevel) {
              firstAidLevel = extracted.firstAidLevel;
              // If there's already an instructor level, don't overwrite it unless it's empty
              if (!instructorLevel) {
                instructorLevel = extracted.instructorLevel;
              }
            }
          }

          // Extract and standardize fields
          const processedRow = {
            name: (row['Student Name'] || '').toString().trim(),
            email: (row['Email'] || '').toString().trim(),
            phone: (row['Phone'] || '').toString().trim(),
            company: (row['Company'] || row['Organization'] || '').toString().trim(),
            firstAidLevel,
            cprLevel: (row['CPR Level'] || '').toString().trim(),
            instructorLevel,
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
            courseMatches: [] as any[],
            certifications: {} as Record<string, string>
          };

          // Collect all certification types found in the row
          certificationTypes.forEach(certType => {
            if (row[certType]) {
              processedRow.certifications[certType] = row[certType].toString().trim();
            }
          });

          // Add standard certification types to the certifications map
          if (processedRow.firstAidLevel) {
            processedRow.certifications['FIRST_AID'] = processedRow.firstAidLevel;
          }
          
          if (processedRow.cprLevel) {
            processedRow.certifications['CPR'] = processedRow.cprLevel;
          }

          if (processedRow.instructorLevel) {
            processedRow.certifications['INSTRUCTOR'] = processedRow.instructorLevel;
          }

          // Validate required fields
          if (!processedRow.name) {
            throw new Error('Name is required');
          }

          if (!processedRow.email) {
            throw new Error('Email is required');
          }

          // Find matching course if enabled
          if (enableCourseMatching && courses) {
            // For each row, find the best matching course based on its own data
            const rowCourseInfo = {
              firstAidLevel: processedRow.firstAidLevel,
              cprLevel: processedRow.cprLevel,
              instructorLevel: processedRow.instructorLevel,
              length: processedRow.courseLength || null,
              issueDate: processedRow.issueDate || null,
              certifications: processedRow.certifications
            };
            
            console.log(`Finding course match for row ${rowNum}:`, rowCourseInfo);
            
            // Type assertion to resolve the incompatible type issue
            const coursesForMatching = courses as unknown as Course[];
            
            // Use the actual selected course ID if one is provided
            const defaultId = selectedCourseId && selectedCourseId !== 'none' 
              ? selectedCourseId 
              : 'default';
            
            // Use the shared utility function to find the best matching course
            const bestMatch = await findBestCourseMatch(
              rowCourseInfo,
              defaultId,
              coursesForMatching
            );
            
            if (bestMatch) {
              hasCourseMatches = true;
              processedRow.courseMatches = [{
                courseId: bestMatch.id,
                courseName: bestMatch.name,
                matchType: bestMatch.matchType,
                confidence: bestMatch.matchType === 'exact' ? 100 : bestMatch.matchType === 'partial' ? 70 : 30,
                certifications: bestMatch.certifications
              }];
              
              console.log(`Match found for row ${rowNum}:`, processedRow.courseMatches[0]);
            } else if (selectedCourseId && selectedCourseId !== 'none') {
              // Fallback to the manually selected course if no match was found
              const manualCourse = courses.find(c => c.id === selectedCourseId);
              if (manualCourse) {
                processedRow.courseMatches = [{
                  courseId: manualCourse.id,
                  courseName: manualCourse.name,
                  matchType: 'manual',
                  confidence: 100,
                  certifications: manualCourse.certification_values 
                    ? Object.entries(manualCourse.certification_values).map(([type, value]) => ({ type, level: value }))
                    : []
                }];
                console.log(`Using manually selected course for row ${rowNum}:`, processedRow.courseMatches[0]);
              }
            }
          } else if (selectedCourseId && selectedCourseId !== 'none' && courses) {
            // If course matching is disabled but we have a selected course, use that
            const selectedCourse = courses.find(c => c.id === selectedCourseId);
            if (selectedCourse) {
              processedRow.courseMatches = [{
                courseId: selectedCourse.id,
                courseName: selectedCourse.name,
                matchType: 'manual',
                confidence: 100,
                certifications: selectedCourse.certification_values 
                  ? Object.entries(selectedCourse.certification_values).map(([type, value]) => ({ type, level: value }))
                  : []
              }];
              console.log(`Using selected course for row ${rowNum}:`, processedRow.courseMatches[0]);
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
                const expiryDate = addMonths(issueDate, matchedCourse.expiration_months);
                processedRow.expiryDate = formatDate(expiryDate);
                console.log(`Calculated expiry date for row ${rowNum}: ${processedRow.expiryDate}`);
              } catch (e) {
                console.error('Error calculating expiry date:', e);
              }
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
