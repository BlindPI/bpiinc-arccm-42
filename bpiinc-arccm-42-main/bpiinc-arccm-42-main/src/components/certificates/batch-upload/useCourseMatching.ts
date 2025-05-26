
import type { Course } from '@/types/courses';
import { VALID_FIRST_AID_LEVELS, VALID_CPR_LEVELS } from '@/components/courses/SimplifiedCourseForm';

export async function findMatchingCourse(courseInfo: { 
  firstAidLevel?: string, 
  cprLevel?: string, 
  courseLength?: number 
}, courses: Course[] | undefined) {
  if (!courses) return null;
  
  // Filter active courses
  const activeCourses = courses.filter(course => course.status === 'ACTIVE');
  
  // Find exact matches on both First Aid Level and CPR Level
  const exactMatches = activeCourses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    return firstAidMatch && cprMatch;
  });
  
  if (exactMatches.length > 0) {
    return {
      courseId: exactMatches[0].id,
      courseName: exactMatches[0].name,
      expirationMonths: exactMatches[0].expiration_months,
      firstAidLevel: exactMatches[0].first_aid_level,
      cprLevel: exactMatches[0].cpr_level,
      length: exactMatches[0].length
    };
  }
  
  // If no exact match on both, try to match just the First Aid Level
  if (courseInfo.firstAidLevel) {
    const firstAidMatches = activeCourses.filter(course => 
      course.first_aid_level && courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase()
    );
    
    if (firstAidMatches.length > 0) {
      return {
        courseId: firstAidMatches[0].id,
        courseName: firstAidMatches[0].name,
        expirationMonths: firstAidMatches[0].expiration_months,
        firstAidLevel: firstAidMatches[0].first_aid_level,
        cprLevel: firstAidMatches[0].cpr_level,
        length: firstAidMatches[0].length
      };
    }
  }
  
  // If no match on First Aid Level, try to match just the CPR Level
  if (courseInfo.cprLevel) {
    const cprMatches = activeCourses.filter(course => 
      course.cpr_level && courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase()
    );
    
    if (cprMatches.length > 0) {
      return {
        courseId: cprMatches[0].id,
        courseName: cprMatches[0].name,
        expirationMonths: cprMatches[0].expiration_months,
        firstAidLevel: cprMatches[0].first_aid_level,
        cprLevel: cprMatches[0].cpr_level,
        length: cprMatches[0].length
      };
    }
  }
  
  // Handle instructor courses
  if (courseInfo.firstAidLevel && courseInfo.firstAidLevel.toLowerCase().includes('instructor')) {
    const instructorCourses = activeCourses.filter(course => 
      course.name.toLowerCase().includes('instructor')
    );
    
    if (instructorCourses.length > 0) {
      // Try to find the most appropriate instructor course
      if (courseInfo.firstAidLevel.toLowerCase().includes('standard')) {
        const standardMatch = instructorCourses.find(course => 
          course.name.toLowerCase().includes('standard')
        );
        if (standardMatch) return mapCourseToMatch(standardMatch);
      }
      
      if (courseInfo.firstAidLevel.toLowerCase().includes('emergency')) {
        const emergencyMatch = instructorCourses.find(course => 
          course.name.toLowerCase().includes('emergency')
        );
        if (emergencyMatch) return mapCourseToMatch(emergencyMatch);
      }
      
      // Default to first instructor course
      return mapCourseToMatch(instructorCourses[0]);
    }
  }
  
  // No match found
  return null;
}

// Helper function to map course to match object
function mapCourseToMatch(course: Course) {
  return {
    courseId: course.id,
    courseName: course.name,
    expirationMonths: course.expiration_months,
    firstAidLevel: course.first_aid_level,
    cprLevel: course.cpr_level,
    length: course.length
  };
}
