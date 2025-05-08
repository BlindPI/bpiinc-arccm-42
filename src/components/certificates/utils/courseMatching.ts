
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
  
  // Filter for active courses only
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  
  // Add more detailed logging to diagnose what's happening with instructor levels
  if (courseInfo.instructorLevel) {
    console.log('Instructor level present in course info:', courseInfo.instructorLevel);
    
    // Log all courses with INSTRUCTOR certification values for debugging
    const instructorCourses = activeCourses.filter(c => 
      c.certification_values && c.certification_values['INSTRUCTOR'] ||
      c.name.toLowerCase().includes('instructor')
    );
    
    console.log(`Found ${instructorCourses.length} potential instructor courses`);
    
    instructorCourses.forEach(c => {
      console.log(`Potential instructor match: ${c.name}`, {
        certValue: c.certification_values?.['INSTRUCTOR'] || 'None',
        nameContainsInstructor: c.name.toLowerCase().includes('instructor')
      });
    });
  }
  
  // 1. Try for instructor matches first - this is our highest priority
  if (courseInfo.instructorLevel) {
    const instructorMatches = findInstructorMatches(courseInfo, activeCourses);
    if (instructorMatches.length > 0) {
      console.log('Found instructor match:', instructorMatches[0].name);
      return createCourseMatchObject(instructorMatches[0], 'exact');
    }
  }
  
  // 2. Try for dynamic certification_values matches (new system)
  if (courseInfo.certifications && Object.keys(courseInfo.certifications).length > 0) {
    const certMatches = findCertificationValueMatches(courseInfo, activeCourses);
    if (certMatches.length > 0) {
      console.log('Found certification values match:', certMatches[0].name);
      return createCourseMatchObject(certMatches[0], 'exact');
    }
  }
  
  // 3. Try for direct field exact matches (old system)
  const exactMatches = findDirectFieldExactMatches(courseInfo, activeCourses);
  if (exactMatches.length > 0) {
    console.log('Found direct field exact match:', exactMatches[0].name);
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // 4. Try for partial matches (less strict)
  const partialMatches = findPartialMatches(courseInfo, activeCourses);
  if (partialMatches.length > 0) {
    console.log('Found partial match:', partialMatches[0].name);
    return createCourseMatchObject(partialMatches[0], 'partial');
  }
  
  // 5. Use default course if provided
  if (defaultCourseId && defaultCourseId !== 'default') {
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId);
    if (defaultCourse) {
      console.log('Using default course:', defaultCourse.name);
      return createCourseMatchObject(defaultCourse, 'default');
    }
  }
  
  // 6. Last resort fallback match
  const fallbackMatch = findFallbackMatch(courseInfo, activeCourses);
  if (fallbackMatch) {
    console.log('Found fallback match:', fallbackMatch.name);
    return createCourseMatchObject(fallbackMatch, 'fallback');
  }
  
  console.log('No matches found for the provided course information');
  return null;
}

/**
 * Find courses that specifically match instructor level
 * This is our highest priority matching method for instructor certifications
 */
function findInstructorMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo.instructorLevel) return [];
  
  // Normalize the input instructor level for comparison
  const inputInstructorLevel = courseInfo.instructorLevel.toLowerCase().trim();
  console.log('Normalized input instructor level for matching:', inputInstructorLevel);
  
  return courses.filter(course => {
    // Check for instructor courses based on certification values first
    if (course.certification_values && course.certification_values['INSTRUCTOR']) {
      const courseInstructorValue = course.certification_values['INSTRUCTOR'].toLowerCase().trim();
      
      // Consider it a match if either contains the other (more flexible matching)
      const isMatch = 
        courseInstructorValue.includes(inputInstructorLevel) || 
        inputInstructorLevel.includes(courseInstructorValue);
      
      if (isMatch) {
        console.log(`Instructor match found on certification value: ${course.name}`, {
          courseValue: courseInstructorValue,
          inputValue: inputInstructorLevel
        });
        return true;
      }
    }
    
    // Fallback to course name for older courses
    if (course.name.toLowerCase().includes('instructor')) {
      // For course name matching, check if the course name contains elements from the instructor level
      // This is less precise but helps with older data
      const relevantWords = inputInstructorLevel.split(/\s+/)
        .filter(word => word.length > 3 && !['instructor', 'level'].includes(word));
      
      const nameMatches = relevantWords.some(word => course.name.toLowerCase().includes(word));
      
      if (nameMatches) {
        console.log(`Instructor match found on course name: ${course.name}`, {
          relevantWords,
          courseName: course.name.toLowerCase()
        });
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Find matches based on the new certification_values system
 */
function findCertificationValueMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo.certifications) return [];
  
  return courses.filter(course => {
    if (!course.certification_values) return false;
    
    // Count how many certification types match
    let matchCount = 0;
    let totalChecked = 0;
    
    Object.entries(courseInfo.certifications).forEach(([type, value]) => {
      if (!value) return; // Skip empty values
      
      const infoValue = (value as string).toLowerCase().trim();
      const courseValue = course.certification_values?.[type]?.toLowerCase().trim();
      
      if (courseValue) {
        totalChecked++;
        
        // Consider it a match if either contains the other
        if (infoValue.includes(courseValue) || courseValue.includes(infoValue)) {
          matchCount++;
        }
      }
    });
    
    // Consider it a match if we checked at least one certification and all checked ones matched
    return totalChecked > 0 && matchCount === totalChecked;
  });
}

/**
 * Find exact matches based on direct field comparison (legacy method)
 */
function findDirectFieldExactMatches(courseInfo: any, courses: Course[]): Course[] {
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
    
    // For an exact match on direct fields, we need either:
    // 1. Both FirstAid and CPR levels to match (if both are specified)
    // 2. FirstAid to match if only it is specified
    // 3. CPR to match if only it is specified
    
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

/**
 * Find partial matches with more flexible text matching
 */
function findPartialMatches(courseInfo: any, courses: Course[]): Course[] {
  if (!courseInfo) return [];
  
  return courses.filter(course => {
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
    
    // Check for partial matches on certification values
    let certValuePartialMatch = false;
    if (courseInfo.certifications && course.certification_values) {
      certValuePartialMatch = Object.entries(courseInfo.certifications).some(([type, value]) => {
        if (!value) return false;
        
        const infoValue = (value as string).toLowerCase();
        const courseValue = course.certification_values?.[type]?.toLowerCase();
        
        if (!courseValue) return false;
        return infoValue.includes(courseValue) || courseValue.includes(infoValue);
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
    return firstAidPartialMatch || cprPartialMatch || certValuePartialMatch || lengthPartialMatch;
  });
}

/**
 * Last resort fallback matching when nothing else works
 */
function findFallbackMatch(courseInfo: any, courses: Course[]): Course | undefined {
  // If we have First Aid Level but no specific match was found, 
  // try to find any course with that certification type
  if (courseInfo.firstAidLevel) {
    // Find any active course with First Aid level set
    const firstAidCourse = courses.find(c => c.first_aid_level !== null);
    if (firstAidCourse) return firstAidCourse;
    
    // If still no match, find any course with First Aid in the course_type name
    const firstAidTypeCourse = courses.find(c => 
      c.course_type?.name?.toLowerCase().includes('first aid')
    );
    
    if (firstAidTypeCourse) return firstAidTypeCourse;
  }
  
  // If we have CPR Level but no specific match was found
  if (courseInfo.cprLevel) {
    // Find any active course with CPR level set
    const cprCourse = courses.find(c => c.cpr_level !== null);
    if (cprCourse) return cprCourse;
    
    // If still no match, find any course with CPR in the course_type name
    const cprTypeCourse = courses.find(c => 
      c.course_type?.name?.toLowerCase().includes('cpr')
    );
    
    if (cprTypeCourse) return cprTypeCourse;
  }
  
  // If we have Instructor Level but no specific match was found
  if (courseInfo.instructorLevel) {
    // Find any active course with Instructor in the name or certification values
    const instructorCourse = courses.find(c => 
      c.name.toLowerCase().includes('instructor') || 
      (c.certification_values && c.certification_values['INSTRUCTOR'])
    );
    if (instructorCourse) return instructorCourse;
  }
  
  // Last resort - just find any active course
  return courses.find(c => c.status === 'ACTIVE');
}

function createCourseMatchObject(course: Course, matchType: CourseMatchType): CourseMatch {
  // Extract all certification types from the course
  const certifications = [];
  
  // Add first aid and cpr from direct fields (old system)
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
  
  // Add dynamic certification types from certification_values (new system)
  if (course.certification_values) {
    Object.entries(course.certification_values).forEach(([type, level]) => {
      // Check if we've already added this from direct fields
      const alreadyAdded = certifications.some(cert => cert.type === type);
      
      if (!alreadyAdded) {
        certifications.push({ type, level });
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
