
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/supabase-schema';
import { VALID_FIRST_AID_LEVELS, VALID_CPR_LEVELS } from '../constants';

interface CourseMatch {
  id: string;
  name: string;
  matchType: 'exact' | 'partial' | 'default';
  expiration_months: number;
}

/**
 * Finds the most appropriate course based on First Aid and CPR level
 */
export async function findMatchingCourse(
  firstAidLevel: string | undefined | null, 
  cprLevel: string | undefined | null,
  defaultCourseId: string,
  length?: number | null
): Promise<CourseMatch | null> {
  try {
    // First retrieve the default course (we'll need it regardless)
    const { data: defaultCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', defaultCourseId)
      .single();
    
    if (!defaultCourse) {
      console.error('Default course not found');
      return null;
    }
    
    // Try to find an exact match using the new columns
    if (firstAidLevel && cprLevel) {
      const { data: exactMatches } = await supabase
        .from('courses')
        .select('*')
        .eq('first_aid_level', firstAidLevel)
        .eq('cpr_level', cprLevel)
        .eq('status', 'ACTIVE');

      // If length is provided, try to find a match with the same length first
      if (exactMatches && exactMatches.length > 0) {
        if (length) {
          const lengthMatch = exactMatches.find(course => course.length === length);
          if (lengthMatch) {
            return {
              id: lengthMatch.id,
              name: lengthMatch.name,
              matchType: 'exact',
              expiration_months: lengthMatch.expiration_months
            };
          }
        }
        
        // If no length match or length not provided, return first exact match
        return {
          id: exactMatches[0].id,
          name: exactMatches[0].name,
          matchType: 'exact',
          expiration_months: exactMatches[0].expiration_months
        };
      }
    }
    
    // Try to find a partial match
    if (firstAidLevel || cprLevel) {
      const query = supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (firstAidLevel) {
        query.eq('first_aid_level', firstAidLevel);
      }
      if (cprLevel) {
        query.eq('cpr_level', cprLevel);
      }
      
      const { data: partialMatches } = await query;
      
      if (partialMatches && partialMatches.length > 0) {
        return {
          id: partialMatches[0].id,
          name: partialMatches[0].name,
          matchType: 'partial',
          expiration_months: partialMatches[0].expiration_months
        };
      }
    }
    
    // Fallback to the default course
    return {
      id: defaultCourse.id,
      name: defaultCourse.name,
      matchType: 'default',
      expiration_months: defaultCourse.expiration_months
    };
  } catch (error) {
    console.error('Error finding matching course:', error);
    return null;
  }
}

export async function getCoursesByLevel(): Promise<{
  firstAidLevels: string[];
  cprLevels: string[];
}> {
  const { data: courses } = await supabase
    .from('courses')
    .select('first_aid_level, cpr_level')
    .eq('status', 'ACTIVE');

  const firstAidLevels = new Set<string>();
  const cprLevels = new Set<string>();

  // Add all valid levels from constants
  VALID_FIRST_AID_LEVELS.forEach(level => {
    if (level) firstAidLevels.add(level);
  });
  
  VALID_CPR_LEVELS.forEach(level => {
    if (level) cprLevels.add(level);
  });

  // Add levels from existing courses
  courses?.forEach(course => {
    if (course.first_aid_level) firstAidLevels.add(course.first_aid_level);
    if (course.cpr_level) cprLevels.add(course.cpr_level);
  });
  
  return {
    firstAidLevels: Array.from(firstAidLevels),
    cprLevels: Array.from(cprLevels),
  };
}
