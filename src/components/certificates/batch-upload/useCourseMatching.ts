
import { useState, useEffect } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { CourseMatch } from '../types';

export interface UseCourseMatchingResult {
  courseMatches: CourseMatch[];
  isLoading: boolean;
  error: Error | null;
}

export function useCourseMatching(processedData: any[] | null): UseCourseMatchingResult {
  const { courseMatches, setCourseMatches } = useBatchUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!processedData || processedData.length === 0) {
      setCourseMatches([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Extract unique course info from the data
      const uniqueCourseInfos = new Set<string>();
      const extractedMatches: CourseMatch[] = [];
      
      processedData.forEach(row => {
        if (row.courseMatches && row.courseMatches.length > 0) {
          const matchKey = JSON.stringify(row.courseMatches[0]);
          if (!uniqueCourseInfos.has(matchKey)) {
            uniqueCourseInfos.add(matchKey);
            extractedMatches.push(row.courseMatches[0]);
          }
        }
      });
      
      setCourseMatches(extractedMatches);
    } catch (err) {
      console.error('Error matching courses:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [processedData, setCourseMatches]);

  return { courseMatches, isLoading, error };
}
