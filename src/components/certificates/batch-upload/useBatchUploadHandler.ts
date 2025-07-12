
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { ProcessedData, ProcessingStatus } from '@/types/batch-upload';
import { format, addMonths, parse } from 'date-fns';
import { useCourseData } from '@/hooks/useCourseData';
import { processExcelFile, extractDataFromFile } from '@/utils/fileProcessing';

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
      errors: [] // Initialize the errors array
    });

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx') {
        const processedRows = await processExcelFile(file);
        console.log('Processed rows from file:', processedRows);
        
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
      setIsProcessing(false);
    }
  };

  const processDataFromFile = async (data: Record<string, any>[], extractedData: any) => {
    try {
      if (!data || data.length === 0) {
        toast.error('No data found in the file');
        return;
      }

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
        errors: [] // Initialize the errors array
      };
      
      setProcessingStatus(status);

      let extractedCourse = null;
      if (extractedData.courseInfo) {
        extractedCourse = await findMatchingCourse({
          firstAidLevel: extractedData.courseInfo.firstAidLevel,
          cprLevel: extractedData.courseInfo.cprLevel,
          courseLength: extractedData.courseInfo.length
        });
      }
      
      let courseMatches: Record<string, CourseMatch> = {};
      let hasCourseMatches = false;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;
        try {
          status.processed++;
          setProcessingStatus({ ...status });

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
            courseMatches: [] as CourseMatch[]
          };

          console.log(`Processing row ${rowNum}:`, processedRow);

          if (!processedRow.name) {
            throw new Error('Name is required');
          }

          if (!processedRow.email) {
            throw new Error('Email is required');
          }

          if (enableCourseMatching) {
            let rowCourseInfo = {
              firstAidLevel: processedRow.firstAidLevel,
              cprLevel: processedRow.cprLevel,
              courseLength: processedRow.courseLength
            };

            if (rowCourseInfo.firstAidLevel || rowCourseInfo.cprLevel || rowCourseInfo.courseLength) {
              extractedCourse = await findMatchingCourse(rowCourseInfo);
            }

            if (extractedCourse) {
              const key = `${processedRow.firstAidLevel}-${processedRow.cprLevel}-${processedRow.courseLength}`;
              
              if (!courseMatches[key]) {
                const matches = await findPotentialCourses({
                  firstAidLevel: processedRow.firstAidLevel,
                  cprLevel: processedRow.cprLevel,
                  courseLength: processedRow.courseLength
                });
                
                courseMatches[key] = matches[0];
                
                if (matches.length > 0) {
                  hasCourseMatches = true;
                }
              }
              
              processedRow.courseMatches = Object.values(courseMatches);
            }
          }

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

  const findMatchingCourse = async (courseInfo: { 
    firstAidLevel: string, 
    cprLevel: string, 
    courseLength: number 
  }) => {
    if (!courses) return null;
    
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
      
      if (courseInfo.firstAidLevel && course.first_aid_level) {
        if (courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase()) {
          score += 50;
        } else if (courseInfo.firstAidLevel.toLowerCase().includes(course.first_aid_level.toLowerCase()) || 
                  course.first_aid_level.toLowerCase().includes(courseInfo.firstAidLevel.toLowerCase())) {
          score += 25;
        }
      }
      
      if (courseInfo.cprLevel && course.cpr_level) {
        if (courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase()) {
          score += 30;
        } else if (courseInfo.cprLevel.toLowerCase().includes(course.cpr_level.toLowerCase()) || 
                  course.cpr_level.toLowerCase().includes(courseInfo.cprLevel.toLowerCase())) {
          score += 15;
        }
      }
      
      if (courseInfo.courseLength && course.length) {
        if (courseInfo.courseLength === course.length) {
          score += 20;
        } else if (Math.abs(courseInfo.courseLength - course.length) <= 2) {
          score += 10;
        }
      }
      
      if (score > 0) {
        matches.push({
          courseId: course.id,
          courseName: course.name,
          confidence: score
        });
      }
    });
    
    return matches.sort((a, b) => b.confidence - a.confidence);
  };

  const formatDate = (dateInput: any): string => {
    try {
      if (!dateInput) return '';
      
      if (typeof dateInput === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch);
        date.setDate(excelEpoch.getDate() + dateInput);
        return format(date, 'yyyy-MM-dd');
      }
      
      if (typeof dateInput === 'string') {
        const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'M/d/yyyy'];
        
        for (const fmt of formats) {
          try {
            const date = parse(dateInput, fmt, new Date());
            if (!isNaN(date.getTime())) {
              return format(date, 'yyyy-MM-dd');
            }
          } catch (e) {
            continue;
          }
        }
        
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return format(date, 'yyyy-MM-dd');
        }
      }
      
      if (dateInput instanceof Date) {
        return format(dateInput, 'yyyy-MM-dd');
      }
      
      return format(new Date(), 'yyyy-MM-dd');
    } catch (e) {
      console.error('Error formatting date:', e);
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  const determineAssessmentStatus = (row: any): string => {
    const assessmentField = row['assessment'] || row['Assessment'] || row['assessment_status'] || row['Assessment Status'] || row['Pass/Fail'] || '';
    
    if (!assessmentField) return 'PASS';
    
    const status = String(assessmentField).trim().toUpperCase();
    
    if (status === 'FAIL' || status === 'FAILED') {
      return 'FAIL';
    } else if (status === 'PENDING' || status === 'NOT ASSESSED') {
      return 'PENDING';
    }
    
    return 'PASS';
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

    const { processedData, selectedCourseId, selectedLocationId } = useBatchUpload();
    
    if (!processedData || processedData.data.length === 0) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);

    try {
      const courseId = selectedCourseId !== 'none' ? selectedCourseId : '';
      
      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error)
        .map(row => {
          let useCourseId = courseId;
          let courseName = '';
          
          if (!useCourseId && row.courseMatches && row.courseMatches.length > 0) {
            useCourseId = row.courseMatches[0].courseId;
          }
          
          if (useCourseId && useCourseId !== 'none') {
            const selectedCourse = courses?.find(course => course.id === useCourseId);
            courseName = selectedCourse?.name || '';
          }
          
          return {
            recipient_name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            course_id: useCourseId || null,
            course_name: courseName,
            issue_date: row.issueDate,
            expiry_date: row.expiryDate || null,
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            status: 'PENDING',
            user_id: user.id,
            location_id: selectedLocationId !== 'none' ? selectedLocationId : null
          };
        });

      if (requests.length === 0) {
        toast.error('No valid records to submit');
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests)
        .select('id');

      if (error) {
        throw error;
      }

      const successCount = data?.length || 0;
      
      toast.success(`Successfully submitted ${successCount} certificate requests`);
      
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
