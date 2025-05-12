
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

/**
 * Finds the best course match based on certificate information
 * Uses direct equality matching for First Aid and CPR levels,
 * plus additional certification values
 */
export async function findBestCourseMatch(
  courseInfo: { 
    firstAidLevel?: string | null; 
    cprLevel?: string | null;
    instructorLevel?: string | null;
    certificationValues?: Record<string, string>;
    courseCode?: string | null;
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
  const firstAidLevel = courseInfo.firstAidLevel || '';
  const cprLevel = courseInfo.cprLevel || '';
  const courseCode = courseInfo.courseCode || '';
  const instructorLevel = courseInfo.instructorLevel || '';
  const certificationValues = courseInfo.certificationValues || {};
  
  console.log(`Matching parameters: 
    First Aid: "${firstAidLevel}", 
    CPR: "${cprLevel}", 
    Instructor: "${instructorLevel}", 
    Code: "${courseCode}",
    Certification Values: ${JSON.stringify(certificationValues)}`
  );
  
  // First check for direct course code match if provided
  if (courseCode) {
    const codeMatch = activeCourses.find(course => 
      course.code && courseCode.toLowerCase() === course.code.toLowerCase()
    );
    
    if (codeMatch) {
      console.log('Found exact match on course code:', codeMatch.name);
      return createCourseMatchObject(codeMatch, 'exact_code');
    }
  }
  
  // Next, check certification_values for matches
  if (Object.keys(certificationValues).length > 0) {
    // Find courses that match ALL certification values
    const certValueMatches = activeCourses.filter(course => {
      if (!course.certification_values) return false;
      
      // Check if all requested cert values are in the course
      return Object.entries(certificationValues).every(([type, value]) => {
        const courseValue = course.certification_values?.[type];
        return courseValue && value.toLowerCase() === courseValue.toLowerCase();
      });
    });
    
    if (certValueMatches.length > 0) {
      console.log('Found match on certification values:', certValueMatches[0].name);
      return createCourseMatchObject(certValueMatches[0], 'certification_value');
    }
  }
  
  // Find exact matches on both First Aid Level and CPR Level
  const exactMatches = activeCourses.filter(course => {
    const firstAidMatch = firstAidLevel && course.first_aid_level && 
      firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    const cprMatch = cprLevel && course.cpr_level && 
      cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    // We want an exact match on both fields if they are provided
    return firstAidMatch && cprMatch;
  });
  
  if (exactMatches.length > 0) {
    console.log('Found exact match on CPR and First Aid level:', exactMatches[0].name);
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // If no exact match on both, try to match just the First Aid Level
  if (firstAidLevel) {
    const firstAidMatches = activeCourses.filter(course => 
      course.first_aid_level && firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase()
    );
    
    if (firstAidMatches.length > 0) {
      console.log('Found match on First Aid level only:', firstAidMatches[0].name);
      return createCourseMatchObject(firstAidMatches[0], 'partial');
    }
  }
  
  // If no match on First Aid Level, try to match just the CPR Level
  if (cprLevel) {
    const cprMatches = activeCourses.filter(course => 
      course.cpr_level && cprLevel.toLowerCase() === course.cpr_level.toLowerCase()
    );
    
    if (cprMatches.length > 0) {
      console.log('Found match on CPR level only:', cprMatches[0].name);
      return createCourseMatchObject(cprMatches[0], 'partial');
    }
  }
  
  // Handle instructor courses more intelligently
  if (instructorLevel || (firstAidLevel && firstAidLevel.toLowerCase().includes('instructor'))) {
    const targetInstructorLevel = instructorLevel || firstAidLevel;
    
    // Try to match instructor courses in certification_values first
    const instructorValueMatches = activeCourses.filter(course => {
      const instructorValue = course.certification_values?.['INSTRUCTOR'];
      return instructorValue && targetInstructorLevel.toLowerCase().includes(instructorValue.toLowerCase());
    });
    
    if (instructorValueMatches.length > 0) {
      console.log('Found instructor match in certification values:', instructorValueMatches[0].name);
      return createCourseMatchObject(instructorValueMatches[0], 'instructor');
    }
    
    // If no match in certification values, look for "instructor" in the name
    const instructorCourses = activeCourses.filter(course => 
      course.name.toLowerCase().includes('instructor')
    );

    if (instructorCourses.length > 0) {
      // Find the most appropriate instructor course
      if (targetInstructorLevel.toLowerCase().includes('standard')) {
        const standardInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('standard') && 
          course.name.toLowerCase().includes('instructor')
        );
        
        if (standardInstructorCourse) {
          console.log('Found standard instructor course match:', standardInstructorCourse.name);
          return createCourseMatchObject(standardInstructorCourse, 'instructor');
        }
      }
      
      if (targetInstructorLevel.toLowerCase().includes('emergency')) {
        const emergencyInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('emergency') && 
          course.name.toLowerCase().includes('instructor')
        );
        
        if (emergencyInstructorCourse) {
          console.log('Found emergency instructor course match:', emergencyInstructorCourse.name);
          return createCourseMatchObject(emergencyInstructorCourse, 'instructor');
        }
      }
      
      // If no specific instructor match found, use the first instructor course
      console.log('Using first available instructor course:', instructorCourses[0].name);
      return createCourseMatchObject(instructorCourses[0], 'instructor_fallback');
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
  
  // Add first aid and CPR levels if they exist
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
    code: course.code,
    matchType,
    length: course.length || undefined,
    expiration_months: course.expiration_months,
    courseType: course.course_type?.name,
    certifications
  };
}
