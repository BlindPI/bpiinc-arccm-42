
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/supabase-schema';

interface CourseMatch {
  id: string;
  name: string;
  matchType: 'exact' | 'partial' | 'default';
  expiration_months: number;
}

export async function findMatchingCourse(
  firstAidLevel: string | undefined | null, 
  cprLevel: string | undefined | null,
  defaultCourseId: string,
  length?: number | null
): Promise<CourseMatch | null> {
  try {
    console.log('Finding matches for:', { firstAidLevel, cprLevel, length });
    
    // First retrieve all active courses
    const { data: activeCourses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (error) {
      console.error('Error fetching active courses:', error);
      return null;
    }
    
    if (!activeCourses || activeCourses.length === 0) {
      console.error('No active courses found');
      return null;
    }

    console.log('Active courses found:', activeCourses.length);
    
    // Try to find an exact match using all criteria
    if (firstAidLevel && cprLevel && length) {
      const exactMatch = activeCourses.find(course => 
        course.first_aid_level === firstAidLevel &&
        course.cpr_level === cprLevel &&
        course.length === length
      );

      if (exactMatch) {
        console.log('Found exact match:', exactMatch);
        return {
          id: exactMatch.id,
          name: exactMatch.name,
          matchType: 'exact',
          expiration_months: exactMatch.expiration_months
        };
      }
    }
    
    // Try to find a partial match based on certification levels
    if (firstAidLevel || cprLevel) {
      const partialMatches = activeCourses.filter(course => {
        if (firstAidLevel && cprLevel) {
          return course.first_aid_level === firstAidLevel || course.cpr_level === cprLevel;
        }
        if (firstAidLevel) {
          return course.first_aid_level === firstAidLevel;
        }
        if (cprLevel) {
          return course.cpr_level === cprLevel;
        }
        return false;
      });
      
      if (partialMatches.length > 0) {
        // Sort partial matches to prioritize - first aid level is more important than CPR level
        const bestMatch = partialMatches.sort((a, b) => {
          // If one matches first aid and the other doesn't, prefer the first aid match
          if (a.first_aid_level === firstAidLevel && b.first_aid_level !== firstAidLevel) return -1;
          if (a.first_aid_level !== firstAidLevel && b.first_aid_level === firstAidLevel) return 1;
          // Both match first aid or both don't, check CPR
          if (a.cpr_level === cprLevel && b.cpr_level !== cprLevel) return -1;
          if (a.cpr_level !== cprLevel && b.cpr_level === cprLevel) return 1;
          // If everything else is tied, prefer the one with a matching length
          if (length) {
            if (a.length === length && b.length !== length) return -1;
            if (a.length !== length && b.length === length) return 1;
          }
          return 0;
        })[0];
        
        console.log('Found partial match:', bestMatch);
        return {
          id: bestMatch.id,
          name: bestMatch.name,
          matchType: 'partial',
          expiration_months: bestMatch.expiration_months
        };
      }
    }
    
    // Fallback to the default course
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId);
    if (!defaultCourse) {
      console.log('Default course not found, using first available course');
      // If the specified default course is not found, use the first available active course
      if (activeCourses.length > 0) {
        return {
          id: activeCourses[0].id,
          name: activeCourses[0].name,
          matchType: 'default',
          expiration_months: activeCourses[0].expiration_months
        };
      }
      throw new Error('No active courses available');
    }
    
    console.log('Using default course:', defaultCourse);
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

export async function getAllActiveCourses(): Promise<Course[]> {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return courses as Course[];
  } catch (error) {
    console.error('Unexpected error fetching courses:', error);
    return [];
  }
}
