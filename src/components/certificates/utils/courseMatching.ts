
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
    // First try to find an exact match for both First Aid and CPR levels
    if (firstAidLevel && cprLevel) {
      const { data: exactMatches } = await supabase
        .from('courses')
        .select('*')
        .eq('first_aid_level', firstAidLevel)
        .eq('cpr_level', cprLevel)
        .eq('status', 'ACTIVE');
      
      if (exactMatches && exactMatches.length > 0) {
        return {
          id: exactMatches[0].id,
          name: exactMatches[0].name,
          matchType: 'exact',
          expiration_months: exactMatches[0].expiration_months
        };
      }
    }
    
    // Then try to find a partial match (just First Aid level)
    if (firstAidLevel) {
      const { data: firstAidMatches } = await supabase
        .from('courses')
        .select('*')
        .eq('first_aid_level', firstAidLevel)
        .is('cpr_level', null)
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
    
    // Then try to find a partial match (just CPR level)
    if (cprLevel) {
      const { data: cprMatches } = await supabase
        .from('courses')
        .select('*')
        .eq('cpr_level', cprLevel)
        .is('first_aid_level', null)
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
    const { data: defaultCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', defaultCourseId)
      .single();
    
    if (defaultCourse) {
      return {
        id: defaultCourse.id,
        name: defaultCourse.name,
        matchType: 'default',
        expiration_months: defaultCourse.expiration_months
      };
    }
    
    return null;
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
  
  courses?.forEach(course => {
    if (course.first_aid_level) firstAidLevels.add(course.first_aid_level);
    if (course.cpr_level) cprLevels.add(course.cpr_level);
  });
  
  return {
    firstAidLevels: Array.from(firstAidLevels),
    cprLevels: Array.from(cprLevels),
  };
}
