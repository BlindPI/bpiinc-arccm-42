
export async function findMatchingCourse(courseInfo: { 
  firstAidLevel?: string, 
  cprLevel?: string, 
  courseLength?: number 
}, courses: any[] | undefined) {
  if (!courses) return null;
  
  // Find exact matches first
  const exactMatches = courses.filter(course => {
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel === course.first_aid_level;
    
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel === course.cpr_level;
    
    return firstAidMatch && cprMatch;
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
  
  // If no exact match on both, try to match just the First Aid Level
  const firstAidMatches = courses.filter(course => {
    return courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel === course.first_aid_level;
  });
  
  if (firstAidMatches.length > 0) {
    return {
      id: firstAidMatches[0].id,
      name: firstAidMatches[0].name,
      expirationMonths: firstAidMatches[0].expiration_months,
      firstAidLevel: firstAidMatches[0].first_aid_level,
      cprLevel: firstAidMatches[0].cpr_level,
      length: firstAidMatches[0].length
    };
  }
  
  // If no match on First Aid Level, try to match just the CPR Level
  const cprMatches = courses.filter(course => {
    return courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel === course.cpr_level;
  });
  
  if (cprMatches.length > 0) {
    return {
      id: cprMatches[0].id,
      name: cprMatches[0].name,
      expirationMonths: cprMatches[0].expiration_months,
      firstAidLevel: cprMatches[0].first_aid_level,
      cprLevel: cprMatches[0].cpr_level,
      length: cprMatches[0].length
    };
  }
  
  return null;
}
