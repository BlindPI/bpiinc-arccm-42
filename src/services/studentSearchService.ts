/**
 * Student search algorithms and filtering logic
 * Provides weighted search functionality for student enrollment
 */

export interface StudentSearchResult {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  company?: string;
  first_aid_level?: string;
  cpr_level?: string;
  course_length?: number;
  enrollment_status?: string;
  completion_status?: string;
  score: number;
}

export interface SearchOptions {
  searchQuery: string;
  maxResults?: number;
  minScore?: number;
}

/**
 * Weighted search scoring system:
 * - Exact match: 100 points
 * - Prefix match: 75 points  
 * - Contains match: 50 points
 * - Fuzzy match: 25 points
 */
const SCORING = {
  EXACT_MATCH: 100,
  PREFIX_MATCH: 75,
  CONTAINS_MATCH: 50,
  FUZZY_MATCH: 25
} as const;

/**
 * Field weights for multi-field search
 */
const FIELD_WEIGHTS = {
  display_name: 1.0,
  email: 0.9,
  company: 0.7,
  phone: 0.6
} as const;

/**
 * Calculate match score for a field value against search query
 */
function calculateFieldScore(fieldValue: string, searchQuery: string): number {
  if (!fieldValue || !searchQuery) return 0;
  
  const field = fieldValue.toLowerCase().trim();
  const query = searchQuery.toLowerCase().trim();
  
  // Don't match if query is just repeated characters or too short
  if (query.length < 2 || /^(.)\1+$/.test(query)) return 0;
  
  // Exact match
  if (field === query) return SCORING.EXACT_MATCH;
  
  // Prefix match
  if (field.startsWith(query)) return SCORING.PREFIX_MATCH;
  
  // Contains match
  if (field.includes(query)) return SCORING.CONTAINS_MATCH;
  
  // Only do fuzzy matching for reasonable queries (3+ chars, not repetitive)
  if (query.length >= 3 && !isRepeatedChars(query)) {
    if (containsAllCharacters(field, query)) return SCORING.FUZZY_MATCH;
  }
  
  return 0;
}

/**
 * Check if string is mostly repeated characters
 */
function isRepeatedChars(str: string): boolean {
  const chars = str.split('');
  const uniqueChars = new Set(chars);
  return uniqueChars.size === 1 || uniqueChars.size < str.length / 2;
}

/**
 * Check if field contains all characters from query (fuzzy matching)
 */
function containsAllCharacters(field: string, query: string): boolean {
  const fieldChars = field.split('');
  const queryChars = query.split('');
  
  for (const char of queryChars) {
    const index = fieldChars.indexOf(char);
    if (index === -1) return false;
    fieldChars.splice(index, 1); // Remove used character
  }
  
  return true;
}

/**
 * Search students with weighted scoring across multiple fields
 */
export function searchStudents(
  students: any[], 
  options: SearchOptions
): StudentSearchResult[] {
  const { searchQuery, maxResults = 50, minScore = 0 } = options;
  
  if (!searchQuery.trim()) {
    return students.slice(0, maxResults).map(student => ({
      ...student,
      score: 0
    }));
  }
  
  const results: StudentSearchResult[] = students
    .map(student => {
      let totalScore = 0;
      let matchCount = 0;
      
      // Search in display_name
      if (student.display_name) {
        const nameScore = calculateFieldScore(student.display_name, searchQuery);
        if (nameScore > 0) {
          totalScore += nameScore * FIELD_WEIGHTS.display_name;
          matchCount++;
        }
      }
      
      // Search in email
      if (student.email) {
        const emailScore = calculateFieldScore(student.email, searchQuery);
        if (emailScore > 0) {
          totalScore += emailScore * FIELD_WEIGHTS.email;
          matchCount++;
        }
      }
      
      // Search in company
      if (student.company) {
        const companyScore = calculateFieldScore(student.company, searchQuery);
        if (companyScore > 0) {
          totalScore += companyScore * FIELD_WEIGHTS.company;
          matchCount++;
        }
      }
      
      // Search in phone (remove formatting for search)
      if (student.phone) {
        const cleanPhone = student.phone.replace(/\D/g, '');
        const cleanQuery = searchQuery.replace(/\D/g, '');
        const phoneScore = calculateFieldScore(cleanPhone, cleanQuery);
        if (phoneScore > 0) {
          totalScore += phoneScore * FIELD_WEIGHTS.phone;
          matchCount++;
        }
      }
      
      // Boost score for multiple field matches
      const finalScore = matchCount > 1 ? totalScore * 1.2 : totalScore;
      
      return {
        ...student,
        score: Math.round(finalScore)
      };
    })
    .filter(result => result.score >= minScore)
    .sort((a, b) => {
      // Sort by score descending, then by name ascending
      if (b.score !== a.score) return b.score - a.score;
      return (a.display_name || '').localeCompare(b.display_name || '');
    })
    .slice(0, maxResults);
    
  return results;
}

/**
 * Filter students by enrollment status
 */
export function filterByEnrollmentStatus(
  students: StudentSearchResult[], 
  status: string | null
): StudentSearchResult[] {
  if (!status) return students;
  return students.filter(student => student.enrollment_status === status);
}

/**
 * Filter students by completion status
 */
export function filterByCompletionStatus(
  students: StudentSearchResult[], 
  status: string | null
): StudentSearchResult[] {
  if (!status) return students;
  return students.filter(student => student.completion_status === status);
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions(
  students: any[], 
  partialQuery: string, 
  maxSuggestions = 5
): string[] {
  if (!partialQuery.trim() || partialQuery.length < 2) return [];
  
  const suggestions = new Set<string>();
  const query = partialQuery.toLowerCase();
  
  students.forEach(student => {
    // Name suggestions
    if (student.display_name?.toLowerCase().includes(query)) {
      suggestions.add(student.display_name);
    }
    
    // Company suggestions
    if (student.company?.toLowerCase().includes(query)) {
      suggestions.add(student.company);
    }
    
    // Email suggestions (domain part)
    if (student.email?.toLowerCase().includes(query)) {
      const emailDomain = student.email.split('@')[1];
      if (emailDomain && emailDomain.toLowerCase().includes(query)) {
        suggestions.add(`@${emailDomain}`);
      }
    }
  });
  
  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Highlight matching text in search results
 */
export function highlightMatch(text: string, searchQuery: string): string {
  if (!searchQuery.trim()) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}