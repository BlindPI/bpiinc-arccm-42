
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
  
  // Filter for active courses only
  const activeCourses = courses.filter(c => c.status === 'ACTIVE');
  
  // Find exact matches on First Aid Level and CPR Level
  const exactMatches = activeCourses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    // We want an exact match on both fields if they are available
    return firstAidMatch && cprMatch;
  });
  
  if (exactMatches.length > 0) {
    console.log('Found exact match on CPR and First Aid level:', exactMatches[0].name);
    return createCourseMatchObject(exactMatches[0], 'exact');
  }
  
  // If no exact match on both, try to match just the First Aid Level
  const firstAidMatches = activeCourses.filter(course => {
    return courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
  });
  
  if (firstAidMatches.length > 0) {
    console.log('Found exact match on First Aid level only:', firstAidMatches[0].name);
    return createCourseMatchObject(firstAidMatches[0], 'partial');
  }
  
  // If no match on First Aid Level, try to match just the CPR Level
  const cprMatches = activeCourses.filter(course => {
    return courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
  });
  
  if (cprMatches.length > 0) {
    console.log('Found exact match on CPR level only:', cprMatches[0].name);
    return createCourseMatchObject(cprMatches[0], 'partial');
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
