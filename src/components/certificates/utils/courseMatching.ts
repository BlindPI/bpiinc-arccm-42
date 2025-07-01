
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

/**
 * Enhanced course matching with strict validation to prevent mismatched assignments
 * This addresses the critical issue where BLS-only courses were incorrectly matched
 * when users specified both First Aid and CPR levels
 */
export async function findBestCourseMatch(
  courseInfo: { 
    firstAidLevel?: string | null; 
    cprLevel?: string | null; 
  }, 
  defaultCourseId: string,
  courses: Course[]
): Promise<CourseMatch | null> {
  
  if (!courses || courses.length === 0) {
    console.log('No courses provided for matching');
    return null;
  }
  
  // Filter for active courses only
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  console.log(`Found ${activeCourses.length} active courses for matching`);
  
  // Get the input values, making sure they're not undefined
  const firstAidLevel = courseInfo.firstAidLevel?.trim() || '';
  const cprLevel = courseInfo.cprLevel?.trim() || '';
  
  console.log(`Matching: First Aid: "${firstAidLevel}", CPR: "${cprLevel}"`);
  
  // CRITICAL FIX: Strict validation mode
  // If user specifies BOTH First Aid AND CPR, we need a course that has BOTH
  const userSpecifiedBoth = firstAidLevel && cprLevel;
  const userSpecifiedFirstAidOnly = firstAidLevel && !cprLevel;
  const userSpecifiedCprOnly = !firstAidLevel && cprLevel;
  
  if (userSpecifiedBoth) {
    console.log('User specified BOTH First Aid and CPR - looking for exact matches only');
    
    // Find courses that have BOTH First Aid and CPR levels
    const exactMatches = activeCourses.filter(course => {
      const courseHasFirstAid = course.first_aid_level && course.first_aid_level.trim();
      const courseHasCpr = course.cpr_level && course.cpr_level.trim();
      
      // Course must have BOTH to be considered
      if (!courseHasFirstAid || !courseHasCpr) {
        return false;
      }
      
      const firstAidMatch = firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
      const cprMatch = cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
      
      return firstAidMatch && cprMatch;
    });
    
    if (exactMatches.length > 0) {
      console.log('Found exact match with both First Aid and CPR:', exactMatches[0].name);
      return createCourseMatchObject(exactMatches[0], 'exact');
    }
    
    // CRITICAL: No fallback to partial matches when user specified both
    console.log('MISMATCH: User specified both First Aid and CPR but no course has both matching levels');
    return {
      id: 'mismatch',
      name: 'COURSE MISMATCH',
      matchType: 'mismatch',
      certifications: [],
      expiration_months: 0,
      mismatchReason: `No course found with both "${firstAidLevel}" First Aid and "${cprLevel}" CPR. Available courses either have different levels or are CPR-only/First Aid-only.`
    };
  }
  
  if (userSpecifiedFirstAidOnly) {
    console.log('User specified First Aid only - looking for First Aid courses');
    
    const firstAidMatches = activeCourses.filter(course => {
      const courseHasFirstAid = course.first_aid_level && course.first_aid_level.trim();
      return courseHasFirstAid && firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    });
    
    if (firstAidMatches.length > 0) {
      console.log('Found First Aid match:', firstAidMatches[0].name);
      return createCourseMatchObject(firstAidMatches[0], 'exact');
    }
    
    console.log('MISMATCH: No course found with specified First Aid level');
    return {
      id: 'mismatch',
      name: 'COURSE MISMATCH',
      matchType: 'mismatch',
      certifications: [],
      expiration_months: 0,
      mismatchReason: `No course found with "${firstAidLevel}" First Aid level.`
    };
  }
  
  if (userSpecifiedCprOnly) {
    console.log('User specified CPR only - looking for CPR courses');
    
    const cprMatches = activeCourses.filter(course => {
      const courseHasCpr = course.cpr_level && course.cpr_level.trim();
      return courseHasCpr && cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    });
    
    if (cprMatches.length > 0) {
      console.log('Found CPR match:', cprMatches[0].name);
      return createCourseMatchObject(cprMatches[0], 'exact');
    }
    
    console.log('MISMATCH: No course found with specified CPR level');
    return {
      id: 'mismatch',
      name: 'COURSE MISMATCH',
      matchType: 'mismatch',
      certifications: [],
      expiration_months: 0,
      mismatchReason: `No course found with "${cprLevel}" CPR level.`
    };
  }
  
  // Handle instructor courses with substring matching
  if (firstAidLevel && firstAidLevel.toLowerCase().includes('instructor')) {
    const instructorCourses = activeCourses.filter(course => 
      course.name.toLowerCase().includes('instructor')
    );

    if (instructorCourses.length > 0) {
      if (firstAidLevel.toLowerCase().includes('standard')) {
        const standardInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('standard')
        );
        
        if (standardInstructorCourse) {
          console.log('Found standard instructor course match:', standardInstructorCourse.name);
          return createCourseMatchObject(standardInstructorCourse, 'partial');
        }
      }
      
      if (firstAidLevel.toLowerCase().includes('emergency')) {
        const emergencyInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('emergency')
        );
        
        if (emergencyInstructorCourse) {
          console.log('Found emergency instructor course match:', emergencyInstructorCourse.name);
          return createCourseMatchObject(emergencyInstructorCourse, 'partial');
        }
      }
      
      console.log('Using first available instructor course:', instructorCourses[0].name);
      return createCourseMatchObject(instructorCourses[0], 'fallback');
    }
  }
  
  // Use default course if provided and no specific matching was requested
  if (defaultCourseId && defaultCourseId !== 'default' && !firstAidLevel && !cprLevel) {
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId);
    if (defaultCourse) {
      console.log('Using default course:', defaultCourse.name);
      return createCourseMatchObject(defaultCourse, 'default');
    }
  }
  
  console.log('No matches found for the provided course information');
  return null;
}

/**
 * Validates if a course match is acceptable for submission
 */
export function validateCourseMatch(match: CourseMatch | null): { isValid: boolean; error?: string } {
  if (!match) {
    return { isValid: false, error: 'No course match found' };
  }
  
  if (match.matchType === 'mismatch') {
    return { 
      isValid: false, 
      error: match.mismatchReason || 'Course mismatch detected'
    };
  }
  
  return { isValid: true };
}

function createCourseMatchObject(course: Course, matchType: CourseMatchType): CourseMatch {
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
  
  // Add any additional certification values from the course
  if (course.certification_values) {
    Object.entries(course.certification_values).forEach(([type, level]) => {
      // Skip ones we already added
      if (type !== 'FIRST_AID' && type !== 'CPR') {
        certifications.push({
          type,
          level
        });
      }
    });
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
