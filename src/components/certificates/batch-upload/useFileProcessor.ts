
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { useCertificationLevelsCache } from '@/hooks/useCertificationLevelsCache';
import { Course } from '@/types/courses';
import { v4 as uuidv4 } from 'uuid';

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

// Parse XLSX file
async function parseXLSX(file: File): Promise<any[]> {
  const { read, utils } = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Extract course info from data
function extractCourseInfo(data: any[]): any {
  // Try to find course name, aid level, cpr level, and issue date in the data
  const extractedData: any = {
    courseInfo: {
      name: null,
      firstAidLevel: null,
      cprLevel: null,
      length: null,
      issueDate: null
    }
  };

  // Look for common headers
  for (const row of data) {
    // Look for course name
    if (row['Course'] && !extractedData.courseInfo.name) {
      extractedData.courseInfo.name = row['Course'];
    }
    
    // Look for first aid level
    if (row['First Aid Level'] && !extractedData.courseInfo.firstAidLevel) {
      extractedData.courseInfo.firstAidLevel = row['First Aid Level'];
    }
    
    // Look for CPR level
    if (row['CPR Level'] && !extractedData.courseInfo.cprLevel) {
      extractedData.courseInfo.cprLevel = row['CPR Level'];
    }
    
    // Look for course length
    if (row['Length'] && !extractedData.courseInfo.length) {
      extractedData.courseInfo.length = parseInt(row['Length'], 10) || null;
    }
    
    // Look for issue date
    if (row['Issue Date'] && !extractedData.issueDate) {
      extractedData.issueDate = formatDate(row['Issue Date']);
    }
  }
  
  return extractedData;
}

// Find best course match based on first aid and CPR levels
async function findBestCourseMatch(courseInfo: any, defaultId: string, courses: Course[]): Promise<any> {
  const { firstAidLevel, cprLevel } = courseInfo;
  
  if (!firstAidLevel && !cprLevel) {
    // If no levels provided, return default course if specified
    if (defaultId && defaultId !== 'default') {
      const defaultCourse = courses.find(c => c.id === defaultId);
      if (defaultCourse) {
        return {
          id: defaultCourse.id,
          name: defaultCourse.name,
          matchType: 'manual',
          certifications: [
            { type: 'FIRST_AID', level: defaultCourse.first_aid_level || 'Unknown' },
            { type: 'CPR', level: defaultCourse.cpr_level || 'Unknown' }
          ],
          expiration_months: defaultCourse.expiration_months
        };
      }
    }
    return null;
  }
  
  // Find exact match (both first aid and CPR)
  if (firstAidLevel && cprLevel) {
    const exactMatch = courses.find(c => 
      c.first_aid_level?.toLowerCase() === firstAidLevel.toLowerCase() &&
      c.cpr_level?.toLowerCase() === cprLevel.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        id: exactMatch.id,
        name: exactMatch.name,
        matchType: 'exact',
        certifications: [
          { type: 'FIRST_AID', level: exactMatch.first_aid_level || 'Unknown' },
          { type: 'CPR', level: exactMatch.cpr_level || 'Unknown' }
        ],
        expiration_months: exactMatch.expiration_months
      };
    }
  }
  
  // Find partial match (either first aid or CPR)
  if (firstAidLevel || cprLevel) {
    const partialMatch = courses.find(c => 
      (firstAidLevel && c.first_aid_level?.toLowerCase() === firstAidLevel.toLowerCase()) ||
      (cprLevel && c.cpr_level?.toLowerCase() === cprLevel.toLowerCase())
    );
    
    if (partialMatch) {
      return {
        id: partialMatch.id,
        name: partialMatch.name,
        matchType: 'partial',
        certifications: [
          { type: 'FIRST_AID', level: partialMatch.first_aid_level || 'Unknown' },
          { type: 'CPR', level: partialMatch.cpr_level || 'Unknown' }
        ],
        expiration_months: partialMatch.expiration_months
      };
    }
  }
  
  // If default ID provided, return that
  if (defaultId && defaultId !== 'default') {
    const defaultCourse = courses.find(c => c.id === defaultId);
    if (defaultCourse) {
      return {
        id: defaultCourse.id,
        name: defaultCourse.name,
        matchType: 'manual',
        certifications: [
          { type: 'FIRST_AID', level: defaultCourse.first_aid_level || 'Unknown' },
          { type: 'CPR', level: defaultCourse.cpr_level || 'Unknown' }
        ],
        expiration_months: defaultCourse.expiration_months
      };
    }
  }
  
  return null;
}

function determineAssessmentStatus(row: any): string {
  const assessmentField = row['assessment'] || row['Assessment'] || row['assessment_status'] || 
                         row['Assessment Status'] || row['Pass/Fail'] || '';
  
  if (!assessmentField) return 'PASS'; // Default to pass if not specified
  
  const status = String(assessmentField).trim().toUpperCase();
  
  if (status === 'FAIL' || status === 'FAILED') {
    return 'FAIL';
  } else if (status === 'PENDING' || status === 'NOT ASSESSED') {
    return 'PENDING';
  }
  
  return 'PASS'; // Default to pass for any other value
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
    setBatchInfo
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
      // Generate a unique batch ID for this upload
      const batchId = uuidv4(); // Use uuid for batch ID
      const batchName = `Batch ${new Date().toLocaleDateString()} - ${file.name.split('.')[0]}`;
      
      // Update batch info in context
      setBatchInfo(batchId, batchName);
      
      // Parse the file based on file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let jsonData: any[] = [];
      
      if (fileExtension === 'xlsx') {
        jsonData = await parseXLSX(file);
      } else if (fileExtension === 'csv') {
        // Add CSV parsing logic if needed
        toast.error('CSV format support coming soon. Please use XLSX for now.');
        setIsProcessingFile(false);
        return;
      } else {
        toast.error('Unsupported file format. Please use XLSX.');
        setIsProcessingFile(false);
        return;
      }
      
      // Extract course info from the data
      const extractedData = extractCourseInfo(jsonData);
      setExtractedCourse(extractedData.courseInfo);
      
      // Process each row
      await processDataRows(jsonData, extractedData, batchId, batchName);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processDataRows = async (data: any[], extractedData: any, batchId: string, batchName: string) => {
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
      const certificationTypes = getAllCertificationTypes ? getAllCertificationTypes() : {};
      let hasCourseMatches = false;

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;
        try {
          status.processed++;
          setProcessingStatus({ ...status });

          // Extract and standardize all fields
          const processedRow = {
            name: (row['Student Name'] || row['Name'] || row['Recipient'] || row['Recipient Name'] || '').toString().trim(),
            email: (row['Email'] || '').toString().trim(),
            phone: (row['Phone'] || '').toString().trim(),
            company: (row['Company'] || row['Organization'] || '').toString().trim(),
            firstAidLevel: (row['First Aid Level'] || '').toString().trim(),
            cprLevel: (row['CPR Level'] || '').toString().trim(),
            courseLength: parseFloat(row['Length']?.toString() || '0') || 0,
            issueDate: extractedData.issueDate || formatDate(row['Issue Date'] || new Date()),
            expiryDate: row['Expiry Date'] ? formatDate(row['Expiry Date']) : '',
            city: (row['City'] || row['Location'] || '').toString().trim(),
            province: (row['Province'] || row['State'] || '').toString().trim(),
            postalCode: (row['Postal Code'] || row['Zip Code'] || '').toString().trim(),
            assessmentStatus: determineAssessmentStatus(row),
            rowNum,
            isProcessed: false,
            error: '',
            courseMatches: [] as any[],
            certifications: {} as Record<string, string>,
            batchId,
            batchName
          };

          // Map standard fields to the certification types
          if (processedRow.firstAidLevel) {
            processedRow.certifications['FIRST_AID'] = processedRow.firstAidLevel;
          }
          
          if (processedRow.cprLevel) {
            processedRow.certifications['CPR'] = processedRow.cprLevel;
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
              cprLevel: processedRow.cprLevel
            };
            
            // Type assertion to resolve type issues
            const coursesForMatching = courses as unknown as Course[];
            
            // Use the actual selected course ID if one is provided
            const defaultId = selectedCourseId && selectedCourseId !== 'none' 
              ? selectedCourseId 
              : 'default';
            
            // Find best course match
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
                confidence: bestMatch.matchType === 'exact' ? 100 : bestMatch.matchType === 'partial' ? 70 : 50,
                certifications: bestMatch.certifications,
                expirationMonths: bestMatch.expiration_months
              }];
              
              // Calculate expiry date if not provided
              if (!processedRow.expiryDate && bestMatch.expiration_months) {
                const issueDate = new Date(processedRow.issueDate);
                if (!isNaN(issueDate.getTime())) {
                  const expiryDate = new Date(issueDate);
                  expiryDate.setMonth(expiryDate.getMonth() + bestMatch.expiration_months);
                  processedRow.expiryDate = expiryDate.toISOString().split('T')[0];
                }
              }
            }
          }

          // Mark as processed successfully
          processedRow.isProcessed = true;
          successCount++;
          status.successful++;

          processedData.data.push(processedRow);
        } catch (error) {
          // Handle row processing error
          failCount++;
          status.failed++;
          processedData.errorCount++;
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          status.errors.push(`Row ${rowNum}: ${errorMessage}`);
          
          processedData.data.push({
            rowNum,
            isProcessed: false,
            error: errorMessage,
            name: (row['Student Name'] || row['Name'] || '').toString().trim(),
            email: (row['Email'] || '').toString().trim(),
            batchId,
            batchName
          });
        }
        
        setProcessingStatus({ ...status });
      }
      
      // Update context with processed data
      setProcessedData(processedData);
      setHasCourseMatches(hasCourseMatches);
      
      // Move to review step if data was processed successfully
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} of ${data.length} rows`);
      } else {
        toast.error('No valid data found in the file');
      }
    } catch (error) {
      console.error('Error processing data rows:', error);
      toast.error(`Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return { processFile };
}
