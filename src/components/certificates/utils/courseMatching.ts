import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/supabase-schema';
import type { CourseMatchType } from '../types';

interface CourseMatch {
  id: string;
  name: string;
  matchType: CourseMatchType;
  expiration_months: number;
}

// Helper function to normalize CPR level for comparison
function normalizeCprLevel(cprLevel: string | null | undefined): string {
  if (!cprLevel) return '';
  
  // Remove expiration months indicator if present (e.g., "24m")
  const withoutMonths = cprLevel.replace(/\s+\d+m\b/gi, '');
  
  // Normalize variations of "w/AED" to "& AED" for consistent comparison
  return withoutMonths.replace('w/AED', '& AED')
                      .replace('w/ AED', '& AED')
                      .replace('with AED', '& AED')
                      .toLowerCase()
                      .trim();
}

// Helper function to compare CPR levels considering the variations
function areCprLevelsEquivalent(level1: string | null | undefined, level2: string | null | undefined): boolean {
  if (!level1 && !level2) return true; // Both empty is a match
  if (!level1 || !level2) return false; // One empty, one not is not a match
  
  return normalizeCprLevel(level1) === normalizeCprLevel(level2);
}

/**
 * Finds a matching course based on provided criteria
 * @param firstAidLevel - First Aid certification level
 * @param cprLevel - CPR certification level
 * @param defaultCourseId - Default course ID to use if no match is found
 * @param length - Course length in hours (optional)
 * @param issueDate - Issue date for the certificate (optional)
 */
export async function findMatchingCourse(
  firstAidLevel: string | undefined | null, 
  cprLevel: string | undefined | null,
  defaultCourseId: string,
  length?: number | null,
  issueDate?: string | null
): Promise<CourseMatch | null> {
  try {
    console.log('Finding matches for:', { 
      firstAidLevel, 
      cprLevel: cprLevel ? `"${cprLevel}"` : null, 
      length, 
      issueDate 
    });
    
    // First retrieve all active courses
    const { data: activeCourses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (error) {
      console.error('Error fetching active courses:', error);
      return null;
    }
    
    if (!activeCourses || activeCourses.length === 0) {
      console.error('No active courses found');
      return null;
    }

    console.log('Active courses found:', activeCourses.length);
    console.log('Available courses:', activeCourses.map(c => ({ 
      id: c.id, 
      name: c.name, 
      firstAidLevel: c.first_aid_level, 
      cprLevel: c.cpr_level ? `"${c.cpr_level}"` : null,
      length: c.length 
    })));
    
    // Try to find an exact match using all criteria
    if (firstAidLevel && cprLevel) {
      // First try with length if available
      if (length) {
        const exactMatch = activeCourses.find(course => 
          (course.first_aid_level === firstAidLevel) &&
          areCprLevelsEquivalent(course.cpr_level, cprLevel) &&
          (course.length === length)
        );

        if (exactMatch) {
          console.log('Found exact match with length:', exactMatch);
          return {
            id: exactMatch.id,
            name: exactMatch.name,
            matchType: 'exact',
            expiration_months: exactMatch.expiration_months
          };
        }
      }
      
      // Try without length
      const exactMatchNoLength = activeCourses.find(course => 
        (course.first_aid_level === firstAidLevel) &&
        areCprLevelsEquivalent(course.cpr_level, cprLevel)
      );

      if (exactMatchNoLength) {
        console.log('Found exact match without length:', exactMatchNoLength);
        return {
          id: exactMatchNoLength.id,
          name: exactMatchNoLength.name,
          matchType: 'exact',
          expiration_months: exactMatchNoLength.expiration_months
        };
      }
    }
    
    // Try to find a partial match based on certification levels
    const partialMatches = activeCourses.filter(course => {
      // Match on first aid level if available
      if (firstAidLevel && course.first_aid_level === firstAidLevel) {
        return true;
      }
      
      // Match on CPR level if available
      if (cprLevel && areCprLevelsEquivalent(course.cpr_level, cprLevel)) {
        return true;
      }
      
      // Match on length if that's all we have
      if (!firstAidLevel && !cprLevel && length && course.length === length) {
        return true;
      }
      
      return false;
    });
      
    if (partialMatches.length > 0) {
      // Sort partial matches to prioritize based on available criteria
      const bestMatch = partialMatches.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;
        
        // Award points for matching first aid level (most important)
        if (firstAidLevel) {
          if (a.first_aid_level === firstAidLevel) aScore += 3;
          if (b.first_aid_level === firstAidLevel) bScore += 3;
        }
        
        // Award points for matching CPR level (second most important)
        if (cprLevel) {
          if (areCprLevelsEquivalent(a.cpr_level, cprLevel)) aScore += 2;
          if (areCprLevelsEquivalent(b.cpr_level, cprLevel)) bScore += 2;
        }
        
        // Award points for matching length (least important)
        if (length) {
          if (a.length === length) aScore += 1;
          if (b.length === length) bScore += 1;
        }
        
        // Sort by score (highest first)
        return bScore - aScore;
      })[0];
      
      console.log('Found best partial match:', bestMatch, 'for criteria:', { firstAidLevel, cprLevel, length });
      return {
        id: bestMatch.id,
        name: bestMatch.name,
        matchType: 'partial',
        expiration_months: bestMatch.expiration_months
      };
    }
    
    // Fallback to the default course
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId);
    if (!defaultCourse) {
      console.log('Default course not found, using first available course');
      // If the specified default course is not found, use the first available active course
      if (activeCourses.length > 0) {
        return {
          id: activeCourses[0].id,
          name: activeCourses[0].name,
          matchType: 'default',
          expiration_months: activeCourses[0].expiration_months
        };
      }
      throw new Error('No active courses available');
    }
    
    console.log('Using default course:', defaultCourse);
    return {
      id: defaultCourse.id,
      name: defaultCourse.name,
      matchType: 'default',
      expiration_months: defaultCourse.expiration_months
    };
  } catch (error) {
    console.error('Error finding matching course:', error);
    return null;
  }
}

/**
 * Retrieves all active courses from the database
 */
export async function getAllActiveCourses(): Promise<Course[]> {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    console.log(`Retrieved ${courses.length} active courses`);
    return courses as Course[];
  } catch (error) {
    console.error('Unexpected error fetching courses:', error);
    return [];
  }
}

/**
 * Finds the best matching course for a roster entry
 */
export async function findBestCourseMatch(
  entry: {
    firstAidLevel?: string | null;
    cprLevel?: string | null;
    length?: number | null;
    issueDate?: string | null;
  },
  defaultCourseId: string,
  activeCourses: Course[]
): Promise<CourseMatch | null> {
  try {
    if (!activeCourses || activeCourses.length === 0) {
      return null;
    }
    
    const { firstAidLevel, cprLevel, length, issueDate } = entry;
    
    // Log the CPR level we're trying to match
    if (cprLevel) {
      console.log(`Looking for match with CPR level: "${cprLevel}", normalized: "${normalizeCprLevel(cprLevel)}"`);
    }
    
    // Try to find an exact match with all available criteria
    if (firstAidLevel && cprLevel) {
      // With length if available
      if (length) {
        const exactMatch = activeCourses.find(course => 
          course.first_aid_level === firstAidLevel &&
          areCprLevelsEquivalent(course.cpr_level, cprLevel) &&
          course.length === length
        );

        if (exactMatch) {
          console.log(`Found exact match with length for ${firstAidLevel} / ${cprLevel}:`, exactMatch.name);
          return {
            id: exactMatch.id,
            name: exactMatch.name,
            matchType: 'exact',
            expiration_months: exactMatch.expiration_months
          };
        }
      }
      
      // Without length
      const exactMatchNoLength = activeCourses.find(course => 
        course.first_aid_level === firstAidLevel &&
        areCprLevelsEquivalent(course.cpr_level, cprLevel)
      );

      if (exactMatchNoLength) {
        console.log(`Found exact match (no length) for ${firstAidLevel} / ${cprLevel}:`, exactMatchNoLength.name);
        return {
          id: exactMatchNoLength.id,
          name: exactMatchNoLength.name,
          matchType: 'exact',
          expiration_months: exactMatchNoLength.expiration_months
        };
      }
    }
    
    // Try partial matches with scoring
    const scoredMatches = activeCourses.map(course => {
      let score = 0;
      
      // Score based on first aid level match
      if (firstAidLevel && course.first_aid_level === firstAidLevel) {
        score += 3;
      }
      
      // Score based on CPR level match
      if (cprLevel && areCprLevelsEquivalent(course.cpr_level, cprLevel)) {
        score += 2;
      }
      
      // Score based on length match
      if (length && course.length === length) {
        score += 1;
      }
      
      return { course, score };
    });
    
    // Get best match if any partial matches
    const bestPartialMatches = scoredMatches
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);
    
    if (bestPartialMatches.length > 0) {
      const bestMatch = bestPartialMatches[0].course;
      console.log(`Found partial match for ${firstAidLevel} / ${cprLevel}:`, bestMatch.name);
      return {
        id: bestMatch.id,
        name: bestMatch.name,
        matchType: 'partial',
        expiration_months: bestMatch.expiration_months
      };
    }
    
    // Fallback to default course
    const defaultCourse = activeCourses.find(c => c.id === defaultCourseId) || activeCourses[0];
    console.log(`Using default course for ${firstAidLevel} / ${cprLevel}:`, defaultCourse.name);
    return {
      id: defaultCourse.id,
      name: defaultCourse.name,
      matchType: 'default',
      expiration_months: defaultCourse.expiration_months
    };
    
  } catch (error) {
    console.error('Error finding best course match:', error);
    return null;
  }
}
