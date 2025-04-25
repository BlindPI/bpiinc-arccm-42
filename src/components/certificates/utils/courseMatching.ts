
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/supabase-schema';

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
  defaultCourseId: string
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
    
    // Try to find an exact match based on course name (for now)
    // In a future implementation, we would query against first_aid_level and cpr_level columns
    // once they're added to the courses table
    if (firstAidLevel && cprLevel) {
      const { data: potentialMatches } = await supabase
        .from('courses')
        .select('*')
        .ilike('name', `%${firstAidLevel}%${cprLevel}%`)
        .eq('status', 'ACTIVE');
        
      if (potentialMatches && potentialMatches.length > 0) {
        return {
          id: potentialMatches[0].id,
          name: potentialMatches[0].name,
          matchType: 'exact',
          expiration_months: potentialMatches[0].expiration_months
        };
      }
    }
    
    // Try to find a partial match with just First Aid level
    if (firstAidLevel) {
      const { data: firstAidMatches } = await supabase
        .from('courses')
        .select('*')
        .ilike('name', `%${firstAidLevel}%`)
        .eq('status', 'ACTIVE');
      
      if (firstAidMatches && firstAidMatches.length > 0) {
        return {
          id: firstAidMatches[0].id,
          name: firstAidMatches[0].name,
          matchType: 'partial',
          expiration_months: firstAidMatches[0].expiration_months
        };
      }
    }
    
    // Try to find a partial match with just CPR level
    if (cprLevel) {
      const { data: cprMatches } = await supabase
        .from('courses')
        .select('*')
        .ilike('name', `%${cprLevel}%`)
        .eq('status', 'ACTIVE');
      
      if (cprMatches && cprMatches.length > 0) {
        return {
          id: cprMatches[0].id,
          name: cprMatches[0].name,
          matchType: 'partial',
          expiration_months: cprMatches[0].expiration_months
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
  // Until we have first_aid_level and cpr_level columns, we'll use constants
  // from the constants.ts file
  const { data: courses } = await supabase
    .from('courses')
    .select('name')
    .eq('status', 'ACTIVE');
  
  // Extract possible levels from course names for now
  // This is a temporary solution until proper columns are added
  const firstAidLevels = new Set<string>();
  const cprLevels = new Set<string>();
  
  // Import constants for valid levels
  import { VALID_FIRST_AID_LEVELS, VALID_CPR_LEVELS } from '../constants';
  
  // Add all valid levels from constants
  VALID_FIRST_AID_LEVELS.forEach(level => {
    if (level) firstAidLevels.add(level);
  });
  
  VALID_CPR_LEVELS.forEach(level => {
    if (level) cprLevels.add(level);
  });
  
  return {
    firstAidLevels: Array.from(firstAidLevels),
    cprLevels: Array.from(cprLevels),
  };
}
