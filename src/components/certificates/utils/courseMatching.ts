
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

export async function findBestCourseMatch(
  courseInfo: { 
    firstAidLevel?: string; 
    cprLevel?: string; 
    length?: number | null;
    issueDate?: string | null;
  }, 
  defaultCourseId: string,
  courses: Course[]
): Promise<CourseMatch | null> {
  
  if (!courses || courses.length === 0) {
    return null;
  }
  
  // Try for exact match first (most strict matching)
  const exactMatches = findExactMatches(courseInfo, courses);
  if (exactMatches.length > 0) {
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // Try for partial matches (less strict)
  const partialMatches = findPartialMatches(courseInfo, courses);
  if (partialMatches.length > 0) {
    return createCourseMatchObject(partialMatches[0], 'partial');
  }
  
  // If a default course ID is provided and exists in the courses array, use it
  if (defaultCourseId !== 'default') {
    const defaultCourse = courses.find(c => c.id === defaultCourseId);
    if (defaultCourse) {
      return createCourseMatchObject(defaultCourse, 'default');
    }
  }
  
  // As a last resort, try to find a fallback match based on certification levels
  const fallbackMatch = findFallbackMatch(courseInfo, courses);
  if (fallbackMatch) {
    return createCourseMatchObject(fallbackMatch, 'fallback');
  }
  
  return null;
}

function findExactMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo) return [];
  
  return courses.filter(course => {
    // Match on First Aid Level if both are specified
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    // Match on CPR Level if both are specified
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    // Match on course length if both are specified
    const lengthMatch = courseInfo.length && course.length && 
      Math.abs(courseInfo.length - course.length) <= 1; // Allow 1 hour difference
    
    // Course must be active
    const isActive = course.status === 'ACTIVE';
    
    // For an exact match, we need either:
    // 1. Both FirstAid and CPR levels to match (if both are specified)
    // 2. FirstAid to match and CPR to match or not be specified
    // 3. CPR to match and FirstAid to not be specified
    
    if (courseInfo.firstAidLevel && courseInfo.cprLevel) {
      // Both are specified, so both should match
      return firstAidMatch && cprMatch && isActive;
    } else if (courseInfo.firstAidLevel) {
      // Only FirstAid is specified
      return firstAidMatch && isActive;
    } else if (courseInfo.cprLevel) {
      // Only CPR is specified
      return cprMatch && isActive;
    }
    
    return false;
  });
}

function findPartialMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo) return [];
  
  return courses.filter(course => {
    // Course must be active
    const isActive = course.status === 'ACTIVE';
    if (!isActive) return false;
    
    // Look for partial text matches in First Aid Level
    let firstAidPartialMatch = false;
    if (courseInfo.firstAidLevel && course.first_aid_level) {
      const infoFA = courseInfo.firstAidLevel.toLowerCase();
      const courseFA = course.first_aid_level.toLowerCase();
      
      firstAidPartialMatch = infoFA.includes(courseFA) || courseFA.includes(infoFA);
    }
    
    // Look for partial text matches in CPR Level
    let cprPartialMatch = false;
    if (courseInfo.cprLevel && course.cpr_level) {
      const infoCPR = courseInfo.cprLevel.toLowerCase();
      const courseCPR = course.cpr_level.toLowerCase();
      
      cprPartialMatch = infoCPR.includes(courseCPR) || courseCPR.includes(infoCPR);
    }
    
    // Check course length with more flexibility
    let lengthPartialMatch = false;
    if (courseInfo.length && course.length) {
      // Allow up to 20% difference in length
      const maxDiff = Math.max(courseInfo.length, course.length) * 0.2;
      lengthPartialMatch = Math.abs(courseInfo.length - course.length) <= maxDiff;
    }
    
    // For a partial match, we need at least one of the fields to match
    return (firstAidPartialMatch || cprPartialMatch || lengthPartialMatch);
  });
}

function findFallbackMatch(courseInfo: any, courses: Course[]): Course | undefined {
  // If we have First Aid Level but no specific match was found, 
  // try to find any course with that certification type
  if (courseInfo.firstAidLevel) {
    // Find any active course with First Aid in the course_type name
    const firstAidCourse = courses.find(c => 
      c.status === 'ACTIVE' && 
      c.course_type?.name?.toLowerCase().includes('first aid')
    );
    
    if (firstAidCourse) return firstAidCourse;
  }
  
  // If we have CPR Level but no specific match was found,
  // try to find any course with that certification type
  if (courseInfo.cprLevel) {
    // Find any active course with CPR in the course_type name
    const cprCourse = courses.find(c => 
      c.status === 'ACTIVE' && 
      c.course_type?.name?.toLowerCase().includes('cpr')
    );
    
    if (cprCourse) return cprCourse;
  }
  
  // Last resort - just find any active course
  return courses.find(c => c.status === 'ACTIVE');
}

function createCourseMatchObject(course: Course, matchType: CourseMatchType): CourseMatch {
  return {
    id: course.id,
    name: course.name,
    matchType,
    length: course.length || undefined,
    expiration_months: course.expiration_months
  };
}
