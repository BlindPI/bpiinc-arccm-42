
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { ProcessedData, ProcessingStatus } from '@/types/batch-upload';
import { format, addMonths, parse } from 'date-fns';
import { useCourseData } from '@/hooks/useCourseData';

interface CourseMatch {
  courseId: string;
  courseName: string;
  confidence: number; // 0-100
}

export function useBatchUploadHandler() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { 
    setProcessingStatus, 
    setProcessedData, 
    isSubmitting, 
    setIsSubmitting,
    enableCourseMatching,
    selectedCourseId,
    selectedLocationId,
    setExtractedCourse,
    setHasCourseMatches
  } = useBatchUpload();
  const { user } = useAuth();
  const { data: courses } = useCourseData();

  const processFileContents = async (file: File) => {
    if (isProcessing) {
      toast.error('Already processing a file');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus({
      processed: 0,
      successful: 0,
      failed: 0,
      total: 0,
      errors: [] // Add the errors array here
    });

    try {
      // Use different processing based on file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx') {
        await processExcelFile(file);
      } else {
        toast.error('Unsupported file format. Please use XLSX.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      const data = await readExcelFile(file);
      if (!data || data.length === 0) {
        toast.error('No data found in the excel file');
        return;
      }

      // Extract headers and convert to lowercase for case-insensitive matching
      const headers = Object.keys(data[0]).map(h => h.toLowerCase());
      const requiredFields = ['name', 'email'];
      const missingFields = requiredFields.filter(field => !headers.includes(field.toLowerCase()));

      if (missingFields.length > 0) {
        toast.error(`Required fields missing: ${missingFields.join(', ')}. Please use the template provided.`);
        return;
      }

      // Process data rows
      const processedData: ProcessedData = { 
        data: [], 
        totalCount: data.length,
        errorCount: 0
      };
      
      let successCount = 0;
      let failCount = 0;
      let status: ProcessingStatus = {
        processed: 0,
        successful: 0,
        failed: 0,
        total: data.length,
        errors: [] // Add the errors array here
      };
      
      setProcessingStatus(status);

      // Look for potential course info in the first row (used for all records)
      const firstRow = data[0];
      let extractedCourse = await extractCourseInfo(firstRow);
      let courseMatches: Record<string, CourseMatch> = {};
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
            name: (row.name || row.Name || row.recipient_name || row.Recipient || row['Recipient Name'] || '').toString().trim(),
            email: (row.email || row.Email || row['E-mail'] || row.EmailAddress || '').toString().trim(),
            phone: (row.phone || row.Phone || row['Phone Number'] || row['Contact'] || '').toString().trim(),
            company: (row.company || row.Company || row.Organization || row['Company/Organization'] || '').toString().trim(),
            firstAidLevel: (row['first aid level'] || row['First Aid Level'] || row['FirstAidLevel'] || row['First Aid'] || '').toString().trim(),
            cprLevel: (row['cpr level'] || row['CPR Level'] || row['CPRLevel'] || row.CPR || '').toString().trim(),
            courseLength: parseFloat(row['course length']?.toString() || row['Course Length']?.toString() || '0') || 0,
            issueDate: formatDate(row['issue date'] || row['Issue Date'] || row['Date'] || row['Course Date'] || new Date()),
            expiryDate: row['expiry date'] || row['Expiry Date'] || '',
            city: (row.city || row.City || row.Location || '').toString().trim(),
            province: (row.province || row.Province || row.State || '').toString().trim(),
            postalCode: (row['postal code'] || row['Postal Code'] || row.Zip || row['Zip Code'] || '').toString().trim(),
            assessmentStatus: determineAssessmentStatus(row),
            rowNum,
            isProcessed: false,
            error: '',
            courseMatches: [] as CourseMatch[]
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

            // If this row has course info, update the extracted course (used for all rows)
            if (rowCourseInfo.firstAidLevel || rowCourseInfo.cprLevel || rowCourseInfo.courseLength) {
              extractedCourse = await findMatchingCourse(rowCourseInfo);
            }

            // If we have extracted course info, find matches
            if (extractedCourse) {
              const key = `${processedRow.firstAidLevel}-${processedRow.cprLevel}-${processedRow.courseLength}`;
              
              // Cache course matches to avoid multiple lookups for the same info
              if (!courseMatches[key]) {
                const matches = await findPotentialCourses({
                  firstAidLevel: processedRow.firstAidLevel,
                  cprLevel: processedRow.cprLevel,
                  courseLength: processedRow.courseLength
                });
                
                courseMatches[key] = matches[0]; // Best match
                
                if (matches.length > 0) {
                  hasCourseMatches = true;
                }
              }
              
              processedRow.courseMatches = Object.values(courseMatches);
            }
          }

          // Calculate expiry date if not provided
          if (!processedRow.expiryDate && extractedCourse?.expiration_months) {
            try {
              const issueDate = new Date(processedRow.issueDate);
              const expiryDate = addMonths(issueDate, extractedCourse.expiration_months);
              processedRow.expiryDate = format(expiryDate, 'yyyy-MM-dd');
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
            name: (row.name || row.Name || '').toString(),
            email: (row.email || row.Email || '').toString(),
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

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const extractCourseInfo = async (row: any) => {
    // If a course is already selected, use that
    if (selectedCourseId && courses) {
      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      if (selectedCourse) {
        return selectedCourse;
      }
    }
    
    // Otherwise, try to extract from the data
    try {
      const courseInfo = {
        firstAidLevel: (row['first aid level'] || row['First Aid Level'] || row['FirstAidLevel'] || row['First Aid'] || '').toString().trim(),
        cprLevel: (row['cpr level'] || row['CPR Level'] || row['CPRLevel'] || row.CPR || '').toString().trim(),
        courseLength: parseFloat(row['course length']?.toString() || row['Course Length']?.toString() || '0') || 0
      };

      // If we have at least one piece of course info, try to find a match
      if (courseInfo.firstAidLevel || courseInfo.cprLevel || courseInfo.courseLength > 0) {
        return await findMatchingCourse(courseInfo);
      }
    } catch (error) {
      console.error('Error extracting course info:', error);
    }
    
    return null;
  };
  
  const findMatchingCourse = async (courseInfo: { 
    firstAidLevel: string, 
    cprLevel: string, 
    courseLength: number 
  }) => {
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
    
    if (exactMatches.length > 0) return exactMatches[0];
    
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
    
    if (partialMatches.length > 0) return partialMatches[0];
    
    return null;
  };
  
  const findPotentialCourses = async (courseInfo: { 
    firstAidLevel: string, 
    cprLevel: string, 
    courseLength: number 
  }): Promise<CourseMatch[]> => {
    if (!courses) return [];
    
    const matches: CourseMatch[] = [];
    
    courses.forEach(course => {
      let score = 0;
      
      // Award points for first aid level match
      if (courseInfo.firstAidLevel && course.first_aid_level) {
        if (courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase()) {
          score += 50; // Exact match is worth more
        } else if (courseInfo.firstAidLevel.toLowerCase().includes(course.first_aid_level.toLowerCase()) || 
                  course.first_aid_level.toLowerCase().includes(courseInfo.firstAidLevel.toLowerCase())) {
          score += 25; // Partial match
        }
      }
      
      // Award points for CPR level match
      if (courseInfo.cprLevel && course.cpr_level) {
        if (courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase()) {
          score += 30; // Exact match
        } else if (courseInfo.cprLevel.toLowerCase().includes(course.cpr_level.toLowerCase()) || 
                  course.cpr_level.toLowerCase().includes(courseInfo.cprLevel.toLowerCase())) {
          score += 15; // Partial match
        }
      }
      
      // Award points for course length match
      if (courseInfo.courseLength && course.length) {
        if (courseInfo.courseLength === course.length) {
          score += 20;
        } else if (Math.abs(courseInfo.courseLength - course.length) <= 2) {
          // Within 2 hours is still a decent match
          score += 10;
        }
      }
      
      // Only include if there's at least some match
      if (score > 0) {
        matches.push({
          courseId: course.id,
          courseName: course.name,
          confidence: score
        });
      }
    });
    
    // Sort by confidence score (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  };

  const formatDate = (dateInput: any): string => {
    try {
      if (!dateInput) return '';
      
      // Handle Excel dates (numbers)
      if (typeof dateInput === 'number') {
        // Excel dates are days since 1899-12-30
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch);
        date.setDate(excelEpoch.getDate() + dateInput);
        return format(date, 'yyyy-MM-dd');
      }
      
      // Handle string dates in various formats
      if (typeof dateInput === 'string') {
        // Try to parse with common formats
        const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'M/d/yyyy'];
        
        for (const fmt of formats) {
          try {
            const date = parse(dateInput, fmt, new Date());
            if (!isNaN(date.getTime())) {
              return format(date, 'yyyy-MM-dd');
            }
          } catch (e) {
            // Continue to next format
          }
        }
        
        // If none of the formats work, try direct parsing
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return format(date, 'yyyy-MM-dd');
        }
      }
      
      // Handle Date objects
      if (dateInput instanceof Date) {
        return format(dateInput, 'yyyy-MM-dd');
      }
      
      // Default to today if we can't parse
      return format(new Date(), 'yyyy-MM-dd');
    } catch (e) {
      console.error('Error formatting date:', e);
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  const determineAssessmentStatus = (row: any): string => {
    const assessmentField = row['assessment'] || row['Assessment'] || row['assessment_status'] || row['Assessment Status'] || '';
    
    if (!assessmentField) return 'PASS'; // Default to pass if not specified
    
    const status = String(assessmentField).trim().toUpperCase();
    
    if (status === 'FAIL' || status === 'FAILED') {
      return 'FAIL';
    } else if (status === 'PENDING' || status === 'NOT ASSESSED') {
      return 'PENDING';
    }
    
    return 'PASS'; // Default to pass for any other value
  };

  const submitProcessedData = async () => {
    if (isSubmitting) {
      toast.error('Already submitting batch');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit certificates');
      return;
    }

    const { processedData } = useBatchUpload();
    if (!processedData || processedData.data.length === 0) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);

    try {
      // Default to the selected course ID if provided
      const courseId = selectedCourseId || '';
      
      // Create certificate requests
      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error) // Only process rows without errors
        .map(row => {
          // Determine which course to use
          let useCourseId = courseId;
          
          // If no course ID was selected, try to use the best match from course matching
          if (!useCourseId && row.courseMatches && row.courseMatches.length > 0) {
            useCourseId = row.courseMatches[0].courseId;
          }
          
          return {
            recipient_name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            course_name: useCourseId, // This will be replaced with the actual course name
            issue_date: row.issueDate,
            expiry_date: row.expiryDate || null,
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            status: 'PENDING',
            user_id: user.id,
            location_id: selectedLocationId || null
          };
        });

      if (requests.length === 0) {
        toast.error('No valid records to submit');
        setIsSubmitting(false);
        return;
      }

      // Use a single transaction for all inserts
      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests)
        .select('id');

      if (error) {
        throw error;
      }

      const successCount = data?.length || 0;
      
      toast.success(`Successfully submitted ${successCount} certificate requests`);
      
      // Send notification to admin about batch upload
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            title: 'Batch Certificate Request',
            message: `A batch of ${successCount} certificate requests has been submitted and is awaiting review.`
          }
        });
      } catch (notificationError) {
        console.error('Error sending batch notification:', notificationError);
      }

    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(`Error submitting batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    processFileContents,
    submitProcessedData
  };
}
