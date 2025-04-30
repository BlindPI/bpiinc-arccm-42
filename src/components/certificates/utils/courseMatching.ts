
export async function findBestCourseMatch(courseInfo: { 
  firstAidLevel?: string, 
  cprLevel?: string, 
  length?: number | null,
  issueDate?: string | null 
}, fallbackCourseId: string, courses: any[] | undefined) {
  if (!courses || courses.length === 0) return null;
  
  console.log('Finding best course match for:', courseInfo);
  
  // Find exact matches first (prioritize matches including length if available)
  const exactMatches = courses.filter(course => {
    // Optimize first aid level matching
    const firstAidMatch = courseInfo.firstAidLevel && course.first_aid_level && 
      courseInfo.firstAidLevel.toLowerCase() === course.first_aid_level.toLowerCase();
    
    // Optimize CPR level matching
    const cprMatch = courseInfo.cprLevel && course.cpr_level && 
      courseInfo.cprLevel.toLowerCase() === course.cpr_level.toLowerCase();
    
    // Add length matching if available
    const lengthMatch = courseInfo.length && course.length && 
      courseInfo.length === course.length;
    
    // Consider a combination of matches for exact matching
    return (firstAidMatch && cprMatch) || 
           (firstAidMatch && lengthMatch) || 
           (cprMatch && lengthMatch);
  });
  
  if (exactMatches.length > 0) {
    console.log('Found exact match:', exactMatches[0].name);
    return {
      id: exactMatches[0].id,
      name: exactMatches[0].name,
      matchType: 'exact',
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
    console.log('Found partial match:', partialMatches[0].name);
    return {
      id: partialMatches[0].id,
      name: partialMatches[0].name,
      matchType: 'partial',
      length: partialMatches[0].length
    };
  }
  
  // Use fallback if no matches found and a fallback is provided
  if (fallbackCourseId !== 'default') {
    const fallbackCourse = courses.find(course => course.id === fallbackCourseId);
    if (fallbackCourse) {
      console.log('Using fallback course:', fallbackCourse.name);
      return {
        id: fallbackCourse.id,
        name: fallbackCourse.name,
        matchType: 'fallback',
        length: fallbackCourse.length
      };
    }
  }
  
  console.log('No matches found');
  return null;
}
