import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { processExcelFile, processCSVFile, extractDataFromFile } from '../utils/fileProcessing';
import { processRosterData } from '../utils/rosterValidation';
import { findMatchingCourse, getAllActiveCourses } from '../utils/courseMatching';
import { useBatchUpload } from './BatchCertificateContext';
import type { ProcessingStatus, CourseMatchType } from '../types';
import type { RosterEntry } from '../utils/rosterValidation';

function normalizeCprLevel(cprLevel: string | null | undefined): string {
  if (!cprLevel) return '';
  
  const withoutMonths = cprLevel.replace(/\s+\d+m\b/gi, '');
  
  return withoutMonths.replace('w/AED', '& AED')
                      .replace('w/ AED', '& AED')
                      .replace('with AED', '& AED')
                      .toLowerCase()
                      .trim();
}

export function useBatchUploadHandler() {
  const { user } = useAuth();
  const {
    setIsUploading,
    setProcessingStatus,
    setProcessedData,
    enableCourseMatching,
    setExtractedCourse,
    processedData,
    setIsSubmitting,
    selectedCourseId,
    extractedCourse,
    issueDate
  } = useBatchUpload();

  const processFileContents = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setProcessingStatus(null);
      
      const fileData = await processFileData(file);
      console.log('Processed file data:', fileData.slice(0, 2));
      
      const extractedInfo = extractDataFromFile(fileData);
      console.log('Extracted info from file:', extractedInfo);

      const { processedData: validatedData, totalCount, errorCount } = processRosterData(
        fileData,
        selectedCourseId || '',
        extractedInfo.issueDate || issueDate || ''
      );
      
      if (enableCourseMatching) {
        await matchCoursesForEntries(validatedData, selectedCourseId || '');
      }
      
      if (extractedInfo.courseInfo) {
        setExtractedCourse(extractedInfo.courseInfo);
      }
      
      setProcessedData({ 
        data: validatedData, 
        totalCount, 
        errorCount 
      });

      if (errorCount > 0) {
        toast.warning(`Found ${errorCount} record(s) with issues. Please review before submitting.`);
      } else {
        toast.success(`Successfully processed ${totalCount} records. Ready for review.`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  }, [enableCourseMatching, setIsUploading, setProcessingStatus, setProcessedData, setExtractedCourse, selectedCourseId, issueDate]);

  const submitProcessedData = useCallback(async () => {
    const effectiveCourseId = selectedCourseId || (extractedCourse && extractedCourse.id) || '';
    
    if (!processedData || !user) {
      toast.error('Missing required information for submission');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const processingStatus: ProcessingStatus = {
        total: processedData.data.filter(entry => !entry.hasError).length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      setProcessingStatus(processingStatus);
      
      const validEntries = processedData.data.filter(entry => !entry.hasError);
      
      if (validEntries.length === 0) {
        toast.error('No valid entries to submit');
        setIsSubmitting(false);
        return;
      }

      const batchSize = 10;
      let currentBatch = 0;
      
      while (currentBatch < validEntries.length) {
        const batch = validEntries.slice(currentBatch, currentBatch + batchSize);
        
        for (const entry of batch) {
          try {
            processingStatus.processed++;
            
            const courseId = entry.matchedCourse?.id || entry.courseId || effectiveCourseId;
            
            if (!courseId) {
              throw new Error('No course specified for this entry');
            }
            
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('name, expiration_months, first_aid_level, cpr_level, length')
              .eq('id', courseId)
              .single();

            if (courseError || !courseData) {
              throw new Error(`Selected course not found: ${courseError?.message || 'Unknown error'}`);
            }
            
            const issueDate = new Date(entry.issueDate);
            const expiryDate = new Date(issueDate);
            expiryDate.setMonth(expiryDate.getMonth() + (courseData.expiration_months || 24));
            
            const { data: requestData, error: requestError } = await supabase
              .from('certificate_requests')
              .insert({
                course_name: courseData.name,
                recipient_name: entry.studentName,
                email: entry.email,
                phone: entry.phone,
                company: entry.company,
                city: entry.city,
                province: entry.province,
                postal_code: entry.postalCode,
                first_aid_level: entry.firstAidLevel || courseData.first_aid_level,
                cpr_level: entry.cprLevel || courseData.cpr_level,
                length: entry.length || courseData.length,
                assessment_status: entry.assessmentStatus,
                instructor_name: entry.instructorName || '',
                issue_date: entry.issueDate,
                expiry_date: expiryDate.toISOString().split('T')[0],
                status: 'PENDING',
                user_id: user.id
              })
              .select()
              .single();
            
            if (requestError) {
              throw requestError;
            }
            
            processingStatus.successful++;
            setProcessingStatus({...processingStatus});
            
          } catch (error) {
            console.error('Error processing entry:', error);
            processingStatus.failed++;
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            processingStatus.errors.push(`Error for ${entry.studentName}: ${errorMessage}`);
            setProcessingStatus({...processingStatus});
          }
        }
        
        currentBatch += batchSize;
        
        setProcessingStatus({...processingStatus});
      }
      
      if (processingStatus.failed > 0) {
        toast.error(`Submission complete with errors: ${processingStatus.successful} successful, ${processingStatus.failed} failed.`);
      } else {
        toast.success(`Successfully submitted ${processingStatus.successful} certificate requests.`);
      }
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(error instanceof Error ? error.message : 'Error submitting batch');
    } finally {
      setIsSubmitting(false);
    }
  }, [processedData, selectedCourseId, extractedCourse, user, setIsSubmitting, setProcessingStatus]);

  return { processFileContents, submitProcessedData };
}

async function processFileData(file: File): Promise<Record<string, any>[]> {
  const fileType = file.name.toLowerCase();
  
  if (fileType.endsWith('.xlsx')) {
    return processExcelFile(file);
  } else if (fileType.endsWith('.csv')) {
    return processCSVFile(file);
  } else {
    throw new Error('Unsupported file type. Please upload a CSV or XLSX file.');
  }
}

async function matchCoursesForEntries(entries: RosterEntry[], defaultCourseId: string): Promise<void> {
  try {
    console.log(`Matching courses for ${entries.length} entries`);
    
    const allCourses = await getAllActiveCourses();
    console.log(`Found ${allCourses.length} active courses for matching`);
    
    if (allCourses.length === 0) {
      console.error('No active courses available for matching');
      return;
    }
    
    console.log('CPR levels in database:', allCourses.map(c => ({
      name: c.name,
      cpr: c.cpr_level,
      normalized: c.cpr_level ? normalizeCprLevel(c.cpr_level) : null
    })));
    
    for (const entry of entries) {
      if (entry.hasError) continue;
      
      try {
        console.log(`Matching entry: ${entry.studentName}`, {
          firstAidLevel: entry.firstAidLevel,
          cprLevel: entry.cprLevel,
          normalizedCprLevel: normalizeCprLevel(entry.cprLevel || ''),
          length: entry.length
        });
        
        const matchedCourse = await findMatchingCourse(
          entry.firstAidLevel,
          entry.cprLevel,
          defaultCourseId,
          entry.length
        );
        
        if (matchedCourse) {
          entry.courseId = matchedCourse.id;
          entry.matchedCourse = {
            id: matchedCourse.id,
            name: matchedCourse.name,
            matchType: matchedCourse.matchType as CourseMatchType
          };
          console.log(`Matched entry ${entry.studentName} to course ${matchedCourse.name} (${matchedCourse.matchType})`);
        } else {
          console.log(`API matching failed for ${entry.studentName}, using simple matching`);
          
          let matched = false;
          if (entry.firstAidLevel && entry.cprLevel) {
            const exactMatch = allCourses.find(c => 
              c.first_aid_level === entry.firstAidLevel && 
              normalizeCprLevel(c.cpr_level || '') === normalizeCprLevel(entry.cprLevel || '')
            );
            
            if (exactMatch) {
              entry.courseId = exactMatch.id;
              entry.matchedCourse = {
                id: exactMatch.id,
                name: exactMatch.name,
                matchType: 'exact'
              };
              matched = true;
              console.log(`Simple exact match found for ${entry.studentName}: ${exactMatch.name}`);
            }
          }
          
          if (!matched && (entry.firstAidLevel || entry.cprLevel)) {
            const scoredMatches = allCourses.map(course => {
              let score = 0;
              
              if (entry.firstAidLevel && course.first_aid_level === entry.firstAidLevel) {
                score += 3;
              }
              
              if (entry.cprLevel && normalizeCprLevel(course.cpr_level || '') === normalizeCprLevel(entry.cprLevel)) {
                score += 2;
              }
              
              if (entry.length && course.length === entry.length) {
                score += 1;
              }
              
              return { course, score };
            });
            
            const bestMatches = scoredMatches
              .filter(match => match.score > 0)
              .sort((a, b) => b.score - a.score);
            
            if (bestMatches.length > 0) {
              const bestMatch = bestMatches[0].course;
              entry.courseId = bestMatch.id;
              entry.matchedCourse = {
                id: bestMatch.id,
                name: bestMatch.name,
                matchType: 'partial'
              };
              matched = true;
              console.log(`Simple partial match found for ${entry.studentName}: ${bestMatch.name} (score: ${bestMatches[0].score})`);
            }
          }
          
          if (!matched) {
            const defaultCourse = allCourses.find(c => c.id === defaultCourseId);
            if (defaultCourse) {
              entry.courseId = defaultCourse.id;
              entry.matchedCourse = {
                id: defaultCourse.id,
                name: defaultCourse.name,
                matchType: 'default'
              };
              console.log(`Using default course for ${entry.studentName}: ${defaultCourse.name}`);
            } else if (allCourses.length > 0) {
              const fallbackCourse = allCourses[0];
              entry.courseId = fallbackCourse.id;
              entry.matchedCourse = {
                id: fallbackCourse.id,
                name: fallbackCourse.name,
                matchType: 'default'
              };
              console.log(`Using fallback course for ${entry.studentName}: ${fallbackCourse.name}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error matching course for entry ${entry.studentName}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during course matching:', error);
  }
}

const mapEntryToCertificateRequest = (entry: RosterEntry) => {
  return {
    recipient_name: entry.studentName,
    email: entry.email || null,
    phone: entry.phone || null,
    company: entry.company || null,
    city: entry.city || null,
    province: entry.province || null,
    postal_code: entry.postalCode || null,
    course_name: entry.matchedCourse?.name || "",
    first_aid_level: entry.firstAidLevel || null,
    cpr_level: entry.cprLevel || null,
    instructor_name: entry.instructorName || null,
    issue_date: entry.issueDate || null,
    expiry_date: entry.expiryDate || null,
    assessment_status: entry.assessmentStatus || null
  };
};
