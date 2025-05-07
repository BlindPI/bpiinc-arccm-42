
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
    console.log('No courses provided for matching');
    return null;
  }
  
  console.log('Finding best course match for:', courseInfo);
  console.log('Available courses for matching:', courses.length);
  
  // Try for exact match first (most strict matching)
  const exactMatches = findExactMatches(courseInfo, courses);
  if (exactMatches.length > 0) {
    console.log('Found exact match:', exactMatches[0].name);
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // Try for partial matches (less strict)
  const partialMatches = findPartialMatches(courseInfo, courses);
  if (partialMatches.length > 0) {
    console.log('Found partial match:', partialMatches[0].name);
    return createCourseMatchObject(partialMatches[0], 'partial');
  }
  
  // If a default course ID is provided and exists in the courses array, use it
  if (defaultCourseId && defaultCourseId !== 'default') {
    const defaultCourse = courses.find(c => c.id === defaultCourseId);
    if (defaultCourse) {
      console.log('Using default course:', defaultCourse.name);
      return createCourseMatchObject(defaultCourse, 'default');
    }
  }
  
  // As a last resort, try to find a fallback match based on certification levels
  const fallbackMatch = findFallbackMatch(courseInfo, courses);
  if (fallbackMatch) {
    console.log('Found fallback match:', fallbackMatch.name);
    return createCourseMatchObject(fallbackMatch, 'fallback');
  }
  
  console.log('No matches found for the provided course information');
  return null;
}

function findExactMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo) return [];
  
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  
  return activeCourses.filter(course => {
    // Match on First Aid Level if both are specified
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    // Match on CPR Level if both are specified
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    // Match on course length if both are specified
    const lengthMatch = courseInfo.length && course.length && 
      Math.abs(courseInfo.length - course.length) <= 1; // Allow 1 hour difference
    
    // For an exact match, we need either:
    // 1. Both FirstAid and CPR levels to match (if both are specified)
    // 2. FirstAid to match and CPR to match or not be specified
    // 3. CPR to match and FirstAid to not be specified
    
    if (courseInfo.firstAidLevel && courseInfo.cprLevel) {
      // Both are specified, so both should match
      return firstAidMatch && cprMatch;
    } else if (courseInfo.firstAidLevel) {
      // Only FirstAid is specified
      return firstAidMatch;
    } else if (courseInfo.cprLevel) {
      // Only CPR is specified
      return cprMatch;
    }
    
    // If no certification levels are specified but length is, match on length
    if (courseInfo.length && !courseInfo.firstAidLevel && !courseInfo.cprLevel) {
      return lengthMatch;
    }
    
    return false;
  });
}

function findPartialMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo) return [];
  
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  
  return activeCourses.filter(course => {
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
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  
  // Check for course type match if we have course type info
  if (courseInfo.courseTypeId) {
    const courseTypeMatch = activeCourses.find(c => c.course_type_id === courseInfo.courseTypeId);
    if (courseTypeMatch) return courseTypeMatch;
  }
  
  // If we have First Aid Level but no specific match was found, 
  // try to find any course with that certification type
  if (courseInfo.firstAidLevel) {
    // Find any active course with First Aid level set
    const firstAidCourse = activeCourses.find(c => c.first_aid_level !== null);
    if (firstAidCourse) return firstAidCourse;
    
    // If still no match, find any course with First Aid in the course_type name
    const firstAidTypeCourse = activeCourses.find(c => 
      c.course_type?.name?.toLowerCase().includes('first aid')
    );
    
    if (firstAidTypeCourse) return firstAidTypeCourse;
  }
  
  // If we have CPR Level but no specific match was found,
  // try to find any course with that certification type
  if (courseInfo.cprLevel) {
    // Find any active course with CPR level set
    const cprCourse = activeCourses.find(c => c.cpr_level !== null);
    if (cprCourse) return cprCourse;
    
    // If still no match, find any course with CPR in the course_type name
    const cprTypeCourse = activeCourses.find(c => 
      c.course_type?.name?.toLowerCase().includes('cpr')
    );
    
    if (cprTypeCourse) return cprTypeCourse;
  }
  
  // Last resort - just find any active course
  return activeCourses.find(c => c.status === 'ACTIVE');
}

function createCourseMatchObject(course: Course, matchType: CourseMatchType): CourseMatch {
  return {
    id: course.id,
    name: course.name,
    matchType,
    length: course.length || undefined,
    expiration_months: course.expiration_months,
    courseType: course.course_type?.name,
    certifications: []
  };
}
