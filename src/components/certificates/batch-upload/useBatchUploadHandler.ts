
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

// Helper function to normalize CPR level for comparison
function normalizeCprLevel(cprLevel: string | null | undefined): string {
  if (!cprLevel) return '';
  
  // Remove expiration months if present (e.g., "24m", "36m")
  const withoutMonths = cprLevel.replace(/\s+\d+m\b/gi, '');
  
  // Normalize w/AED to & AED
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
      
      // Process the file and get the rows
      const fileData = await processFileData(file);
      console.log('Processed file data:', fileData.slice(0, 2));
      
      // Extract any course information and issue dates from the file
      const extractedInfo = extractDataFromFile(fileData);
      console.log('Extracted info from file:', extractedInfo);

      // Transform and validate the data
      // Use empty strings as default values since we might not have selected a course or issue date yet
      const { processedData: validatedData, totalCount, errorCount } = processRosterData(
        fileData,
        selectedCourseId || '',
        extractedInfo.issueDate || issueDate || ''
      );
      
      // If course matching is enabled, find matching courses for each entry
      if (enableCourseMatching) {
        await matchCoursesForEntries(validatedData, selectedCourseId || '');
      }
      
      // Set the extracted course info if found
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
    // Get the appropriate course ID - either selected by user or extracted from file
    const effectiveCourseId = selectedCourseId || (extractedCourse && extractedCourse.id) || '';
    
    if (!processedData || !user) {
      toast.error('Missing required information for submission');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the processing status object
      const processingStatus: ProcessingStatus = {
        total: processedData.data.filter(entry => !entry.hasError).length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      setProcessingStatus(processingStatus);
      
      // Filter out entries with errors
      const validEntries = processedData.data.filter(entry => !entry.hasError);
      
      if (validEntries.length === 0) {
        toast.error('No valid entries to submit');
        setIsSubmitting(false);
        return;
      }

      // Process in smaller batches to avoid timeouts
      const batchSize = 10;
      let currentBatch = 0;
      
      while (currentBatch < validEntries.length) {
        const batch = validEntries.slice(currentBatch, currentBatch + batchSize);
        
        for (const entry of batch) {
          try {
            processingStatus.processed++;
            
            // Get the course details from the entry or the default
            // First try entry's directly matched course, then fallback to global course selection
            const courseId = entry.matchedCourse?.id || entry.courseId || effectiveCourseId;
            
            if (!courseId) {
              throw new Error('No course specified for this entry');
            }
            
            console.log(`Processing entry for ${entry.studentName} with course ID: ${courseId}`);
            
            // Get the course name and expiration months from the selected course ID
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('name, expiration_months, first_aid_level, cpr_level, length')
              .eq('id', courseId)
              .single();

            if (courseError || !courseData) {
              throw new Error(`Selected course not found: ${courseError?.message || 'Unknown error'}`);
            }
            
            console.log(`Found course data for ${entry.studentName}:`, courseData);
            
            // Calculate expiry date based on course expiration months
            const issueDate = new Date(entry.issueDate);
            const expiryDate = new Date(issueDate);
            expiryDate.setMonth(expiryDate.getMonth() + (courseData.expiration_months || 24));
            
            // Create the certificate request
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
        
        // Move to next batch
        currentBatch += batchSize;
        
        // Update the processing status after each batch
        setProcessingStatus({...processingStatus});
      }
      
      // Show final status
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
    
    // Fetch all courses once to avoid multiple API calls
    const allCourses = await getAllActiveCourses();
    console.log(`Found ${allCourses.length} active courses for matching`);
    
    if (allCourses.length === 0) {
      console.error('No active courses available for matching');
      return;
    }
    
    // Add debug output for CPR levels in database
    console.log('CPR levels in database:', allCourses.map(c => ({
      name: c.name,
      cpr: c.cpr_level,
      normalized: c.cpr_level ? normalizeCprLevel(c.cpr_level) : null
    })));
    
    for (const entry of entries) {
      if (entry.hasError) continue;
      
      try {
        // Log entry information before matching
        console.log(`Matching entry: ${entry.studentName}`, {
          firstAidLevel: entry.firstAidLevel,
          cprLevel: entry.cprLevel,
          normalizedCprLevel: normalizeCprLevel(entry.cprLevel || ''),
          length: entry.length
        });
        
        // First try to use the API approach for sophisticated matching
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
          // Fallback to simple matching if API approach fails
          console.log(`API matching failed for ${entry.studentName}, using simple matching`);
          
          // Try to find an exact match
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
          
          // If no match yet, try partial match
          if (!matched && (entry.firstAidLevel || entry.cprLevel)) {
            // Setup scoring system for partial matches
            const scoredMatches = allCourses.map(course => {
              let score = 0;
              
              // Score for first aid level match
              if (entry.firstAidLevel && course.first_aid_level === entry.firstAidLevel) {
                score += 3;
              }
              
              // Score for CPR level match
              if (entry.cprLevel && normalizeCprLevel(course.cpr_level || '') === normalizeCprLevel(entry.cprLevel)) {
                score += 2;
              }
              
              // Score for length match
              if (entry.length && course.length === entry.length) {
                score += 1;
              }
              
              return { course, score };
            });
            
            // Sort by score and get the best match
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
          
          // Default to selected course if no match found
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
              // If defaultCourseId doesn't match any course, use the first available course
              const fallbackCourse = allCourses[0];
              entry.courseId = fallbackCourse.id;
              entry.matchedCourse = {
                id: fallbackCourse.id,
                name: fallbackCourse.name,
                matchType: 'default' // Using 'default' instead of 'fallback'
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
