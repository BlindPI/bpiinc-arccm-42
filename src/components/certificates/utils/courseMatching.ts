
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
    // First retrieve all active courses
    const { data: activeCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (!activeCourses) {
      console.error('No active courses found');
      return null;
    }
    
    // Type assertion to ensure we're using the correct type
    const typedCourses = activeCourses as Course[];
    
    // Try to find an exact match using all criteria
    if (firstAidLevel && cprLevel && length) {
      const exactMatch = typedCourses.find(course => 
        course.first_aid_level === firstAidLevel &&
        course.cpr_level === cprLevel &&
        course.length === length
      );

      if (exactMatch) {
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
      const partialMatch = typedCourses.find(course => {
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

      if (partialMatch) {
        return {
          id: partialMatch.id,
          name: partialMatch.name,
          matchType: 'partial',
          expiration_months: partialMatch.expiration_months
        };
      }
    }
    
    // Fallback to the default course
    const defaultCourse = typedCourses.find(c => c.id === defaultCourseId);
    if (!defaultCourse) {
      throw new Error('Default course not found');
    }
    
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
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('name');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  // Type assertion to ensure we're returning the correct type
  return courses as Course[];
}
