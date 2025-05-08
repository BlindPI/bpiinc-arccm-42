
import type { Course } from '@/types/courses';
import type { CourseMatch, CourseMatchType } from '../types';

/**
 * Finds the best course match based on certificate information
 * Uses direct equality matching for First Aid and CPR levels
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
  const firstAidLevel = courseInfo.firstAidLevel || '';
  const cprLevel = courseInfo.cprLevel || '';
  
  console.log(`Matching: First Aid: "${firstAidLevel}", CPR: "${cprLevel}"`);
  
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
  
  // Handle instructor courses by looking for substring matches
  if (firstAidLevel && firstAidLevel.toLowerCase().includes('instructor')) {
    const instructorCourses = activeCourses.filter(course => 
      course.name.toLowerCase().includes('instructor')
    );

    if (instructorCourses.length > 0) {
      // Find the most appropriate instructor course
      if (firstAidLevel.toLowerCase().includes('standard')) {
        const standardInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('standard') && 
          course.name.toLowerCase().includes('instructor')
        );
        
        if (standardInstructorCourse) {
          console.log('Found standard instructor course match:', standardInstructorCourse.name);
          return createCourseMatchObject(standardInstructorCourse, 'partial');
        }
      }
      
      if (firstAidLevel.toLowerCase().includes('emergency')) {
        const emergencyInstructorCourse = instructorCourses.find(course => 
          course.name.toLowerCase().includes('emergency') && 
          course.name.toLowerCase().includes('instructor')
        );
        
        if (emergencyInstructorCourse) {
          console.log('Found emergency instructor course match:', emergencyInstructorCourse.name);
          return createCourseMatchObject(emergencyInstructorCourse, 'partial');
        }
      }
      
      // If no specific instructor match found, use the first instructor course
      console.log('Using first available instructor course:', instructorCourses[0].name);
      return createCourseMatchObject(instructorCourses[0], 'fallback');
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
