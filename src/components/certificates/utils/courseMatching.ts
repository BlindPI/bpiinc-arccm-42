
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

export async function findBestCourseMatch(
  courseInfo: { 
    firstAidLevel?: string; 
    cprLevel?: string; 
    instructorLevel?: string;
    length?: number | null;
    issueDate?: string | null;
    certifications?: Record<string, string>;
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
    
    // Match on Instructor Level if course has certification values
    let instructorMatch = false;
    if (courseInfo.instructorLevel && course.certification_values) {
      const courseInstructorLevel = course.certification_values['INSTRUCTOR'];
      instructorMatch = courseInstructorLevel && 
        courseInfo.instructorLevel.toLowerCase().includes(courseInstructorLevel.toLowerCase());
    }
    
    // Match on course length if both are specified
    const lengthMatch = courseInfo.length && course.length && 
      Math.abs(courseInfo.length - course.length) <= 1; // Allow 1 hour difference
    
    // Check for exact matches on dynamic certification types
    let dynamicCertMatch = false;
    if (courseInfo.certifications && course.certification_values) {
      // Count how many certifications match
      const matchCount = Object.entries(courseInfo.certifications).reduce((count, [type, value]) => {
        if (value && course.certification_values[type] && 
            value.toLowerCase() === course.certification_values[type].toLowerCase()) {
          return count + 1;
        }
        return count;
      }, 0);
      
      // Consider it a match if at least one certification type matches exactly
      dynamicCertMatch = matchCount > 0;
    }
    
    // For an exact match, we need either:
    // 1. Both FirstAid and CPR levels to match (if both are specified)
    // 2. FirstAid to match and CPR to match or not be specified
    // 3. CPR to match and FirstAid to not be specified
    // 4. Instructor level to match
    // 5. Dynamic certification type to match
    
    if (courseInfo.firstAidLevel && courseInfo.cprLevel) {
      // Both are specified, so both should match
      return firstAidMatch && cprMatch;
    } else if (courseInfo.firstAidLevel) {
      // Only FirstAid is specified
      return firstAidMatch;
    } else if (courseInfo.cprLevel) {
      // Only CPR is specified
      return cprMatch;
    } else if (courseInfo.instructorLevel) {
      // Only Instructor level is specified
      return instructorMatch;
    } else if (dynamicCertMatch) {
      // Match on other certification types
      return dynamicCertMatch;
    }
    
    // If no certification levels are specified but length is, match on length
    if (courseInfo.length && !courseInfo.firstAidLevel && !courseInfo.cprLevel && !courseInfo.instructorLevel) {
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
    
    // Look for partial text matches in Instructor Level
    let instructorPartialMatch = false;
    if (courseInfo.instructorLevel && course.certification_values) {
      const infoInst = courseInfo.instructorLevel.toLowerCase();
      const courseInst = course.certification_values['INSTRUCTOR']?.toLowerCase();
      
      if (courseInst) {
        instructorPartialMatch = infoInst.includes(courseInst) || courseInst.includes(infoInst);
      }
    }
    
    // Check for partial matches on dynamic certification types
    let dynamicCertPartialMatch = false;
    if (courseInfo.certifications && course.certification_values) {
      // Consider it a match if at least one certification type partially matches
      dynamicCertPartialMatch = Object.entries(courseInfo.certifications).some(([type, value]) => {
        if (value && course.certification_values[type]) {
          const infoValue = value.toLowerCase();
          const courseValue = course.certification_values[type].toLowerCase();
          return infoValue.includes(courseValue) || courseValue.includes(infoValue);
        }
        return false;
      });
    }
    
    // Check course length with more flexibility
    let lengthPartialMatch = false;
    if (courseInfo.length && course.length) {
      // Allow up to 20% difference in length
      const maxDiff = Math.max(courseInfo.length, course.length) * 0.2;
      lengthPartialMatch = Math.abs(courseInfo.length - course.length) <= maxDiff;
    }
    
    // For a partial match, we need at least one of the fields to match
    return (firstAidPartialMatch || cprPartialMatch || instructorPartialMatch || 
            dynamicCertPartialMatch || lengthPartialMatch);
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
  
  // If we have Instructor Level but no specific match was found
  if (courseInfo.instructorLevel) {
    // Find any active course with Instructor in the name
    const instructorCourse = activeCourses.find(c => 
      c.name.toLowerCase().includes('instructor') || 
      (c.certification_values && c.certification_values['INSTRUCTOR'])
    );
    if (instructorCourse) return instructorCourse;
  }
  
  // If we have other certification types
  if (courseInfo.certifications) {
    for (const [type, value] of Object.entries(courseInfo.certifications)) {
      if (!value) continue;
      
      // Find any course with this certification type
      const certCourse = activeCourses.find(c => 
        c.certification_values && c.certification_values[type]
      );
      if (certCourse) return certCourse;
    }
  }
  
  // Last resort - just find any active course
  return activeCourses.find(c => c.status === 'ACTIVE');
}

function createCourseMatchObject(course: Course, matchType: CourseMatchType): CourseMatch {
  // Extract all certification types from the course
  const certifications = [];
  
  if (course.first_aid_level) {
    certifications.push({
      type: 'FIRST_AID',
      level: course.first_aid_level
    });
  }
  
  if (course.cpr_level) {
    certifications.push({
      type: 'CPR',
      level: course.cpr_level
    });
  }
  
  // Add dynamic certification types from course_certification_values
  if (course.certification_values) {
    for (const [type, level] of Object.entries(course.certification_values)) {
      if (type !== 'FIRST_AID' && type !== 'CPR') {
        certifications.push({
          type,
          level
        });
      }
    }
  }
  
  return {
    id: course.id,
    name: course.name,
    matchType,
    length: course.length || undefined,
    expiration_months: course.expiration_months,
    courseType: course.course_type?.name,
    certifications
  };
}
