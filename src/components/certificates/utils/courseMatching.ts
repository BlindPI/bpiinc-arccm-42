
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

/**
 * Normalizes a string for comparison by removing common prefixes,
 * converting to lowercase, and trimming whitespace
 */
function normalizeString(str: string | undefined | null): string {
  if (!str) return '';
  
  let normalized = str.trim().toLowerCase();
  
  // Remove common prefixes for matching
  normalized = normalized
    .replace(/^instructor:\s*/i, '')
    .replace(/^recertification:\s*/i, '')
    .replace(/^recert\.?:\s*/i, '')
    .replace(/^advanced\s+/i, '');
    
  return normalized;
}

/**
 * Checks if two strings are similar enough to be considered a match
 * Uses a more flexible comparison than strict equality
 */
function isStringMatch(str1: string | undefined | null, str2: string | undefined | null): boolean {
  if (!str1 || !str2) return false;
  
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  // First try exact match on normalized strings
  if (norm1 === norm2) return true;
  
  // Then check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  return false;
}

/**
 * Finds the best course match based on certificate information
 */
export async function findBestCourseMatch(
  courseInfo: { 
    firstAidLevel?: string | null; 
    cprLevel?: string | null; 
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
  
  // Filter for active courses only
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  console.log(`Found ${activeCourses.length} active courses for matching`);
  
  // Extract original and normalized values for logging
  const firstAidLevelOrig = courseInfo.firstAidLevel || '';
  const cprLevelOrig = courseInfo.cprLevel || '';
  const firstAidLevel = normalizeString(courseInfo.firstAidLevel);
  const cprLevel = normalizeString(courseInfo.cprLevel);
  
  console.log(`Trying to match: First Aid: "${firstAidLevelOrig}" (${firstAidLevel}), CPR: "${cprLevelOrig}" (${cprLevel})`);
  
  // Check for instructor courses
  const isInstructorCourse = firstAidLevelOrig.match(/instructor/i) || cprLevelOrig.match(/instructor/i);
  if (isInstructorCourse) {
    console.log('Detected instructor course, looking for instructor matches');
    
    // Look for instructor courses with matching certification values
    const instructorMatches = activeCourses.filter(course => {
      // Check name for instructor courses
      const isInstructor = course.name.toLowerCase().includes('instructor');
      
      // Check certification values for INSTRUCTOR type
      const hasInstructorCert = course.certification_values && 
        course.certification_values['INSTRUCTOR'] !== undefined;
      
      // For instructor courses, we'll do a looser match on first aid/CPR levels
      let levelMatch = false;
      if (firstAidLevel && course.first_aid_level) {
        levelMatch = isStringMatch(firstAidLevel, course.first_aid_level);
      } else if (cprLevel && course.cpr_level) {
        levelMatch = isStringMatch(cprLevel, course.cpr_level);
      }
      
      return (isInstructor || hasInstructorCert) && levelMatch;
    });
    
    if (instructorMatches.length > 0) {
      console.log('Found instructor course match:', instructorMatches[0].name);
      return createCourseMatchObject(instructorMatches[0], 'exact');
    }
  }
  
  // Find exact matches on First Aid Level and CPR Level
  const exactMatches = activeCourses.filter(course => {
    const firstAidMatch = firstAidLevel && course.first_aid_level && 
      isStringMatch(firstAidLevel, course.first_aid_level);
    
    const cprMatch = cprLevel && course.cpr_level && 
      isStringMatch(cprLevel, course.cpr_level);
    
    // We want an exact match on both fields if they are available
    return firstAidMatch && cprMatch;
  });
  
  if (exactMatches.length > 0) {
    console.log('Found exact match on CPR and First Aid level:', exactMatches[0].name);
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // If no exact match on both, try to match just the First Aid Level
  const firstAidMatches = activeCourses.filter(course => {
    return firstAidLevel && course.first_aid_level && 
      isStringMatch(firstAidLevel, course.first_aid_level);
  });
  
  if (firstAidMatches.length > 0) {
    console.log('Found match on First Aid level only:', firstAidMatches[0].name);
    return createCourseMatchObject(firstAidMatches[0], 'partial');
  }
  
  // If no match on First Aid Level, try to match just the CPR Level
  const cprMatches = activeCourses.filter(course => {
    return cprLevel && course.cpr_level && 
      isStringMatch(cprLevel, course.cpr_level);
  });
  
  if (cprMatches.length > 0) {
    console.log('Found match on CPR level only:', cprMatches[0].name);
    return createCourseMatchObject(cprMatches[0], 'partial');
  }
  
  // Name-based matching as fallback
  if (firstAidLevelOrig || cprLevelOrig) {
    const nameMatches = activeCourses.filter(course => {
      const courseName = course.name.toLowerCase();
      
      // Try to match by first aid level in course name
      if (firstAidLevelOrig) {
        const normalizedSearch = normalizeString(firstAidLevelOrig);
        if (courseName.includes(normalizedSearch)) return true;
      }
      
      // Try to match by CPR level in course name
      if (cprLevelOrig) {
        const normalizedSearch = normalizeString(cprLevelOrig);
        if (courseName.includes(normalizedSearch)) return true;
      }
      
      return false;
    });
    
    if (nameMatches.length > 0) {
      console.log('Found name-based match:', nameMatches[0].name);
      return createCourseMatchObject(nameMatches[0], 'partial');
    }
  }
  
  // Use default course if provided
  if (defaultCourseId && defaultCourseId !== 'default') {
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId);
    if (defaultCourse) {
      console.log('Using default course:', defaultCourse.name);
      return createCourseMatchObject(defaultCourse, 'default');
    }
  }
  
  console.log('No matches found for the provided course information');
  return null;
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
