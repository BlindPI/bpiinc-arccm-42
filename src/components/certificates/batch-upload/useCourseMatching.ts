
export async function findMatchingCourse(courseInfo: { 
  firstAidLevel?: string, 
  cprLevel?: string, 
  courseLength?: number 
}, courses: any[] | undefined) {
  if (!courses) return null;
  
  // Find exact matches first
  const exactMatches = courses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    const lengthMatch = courseInfo.courseLength && course.length && 
      courseInfo.courseLength === course.length;
    
    return (firstAidMatch && cprMatch) || (firstAidMatch && lengthMatch) || (cprMatch && lengthMatch);
  });
  
  if (exactMatches.length > 0) {
    return {
      id: exactMatches[0].id,
      name: exactMatches[0].name,
      expirationMonths: exactMatches[0].expiration_months,
      firstAidLevel: exactMatches[0].first_aid_level,
      cprLevel: exactMatches[0].cpr_level,
      length: exactMatches[0].length
    };
  }
  
  // Find partial matches if no exact match
  const partialMatches = courses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      (courseInfo.firstAidLevel.toLowerCase().includes(course.first_aid_level.toLowerCase()) || 
       course.first_aid_level.toLowerCase().includes(courseInfo.firstAidLevel.toLowerCase()));
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      (courseInfo.cprLevel.toLowerCase().includes(course.cpr_level.toLowerCase()) || 
       course.cpr_level.toLowerCase().includes(courseInfo.cprLevel.toLowerCase()));
    
    return firstAidMatch || cprMatch;
  });
  
  if (partialMatches.length > 0) {
    return {
      id: partialMatches[0].id,
      name: partialMatches[0].name,
      expirationMonths: partialMatches[0].expiration_months,
      firstAidLevel: partialMatches[0].first_aid_level,
      cprLevel: partialMatches[0].cpr_level,
      length: partialMatches[0].length
    };
  }
  
  return null;
}
