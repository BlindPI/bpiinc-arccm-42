import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchStudents, type StudentSearchResult, type SearchOptions } from '@/services/studentSearchService';

export interface UseStudentSearchOptions {
  students: any[];
  debounceMs?: number;
  maxResults?: number;
  minScore?: number;
}

export interface UseStudentSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredStudents: StudentSearchResult[];
  selectedStudent: StudentSearchResult | null;
  setSelectedStudent: (student: StudentSearchResult | null) => void;
  isSearching: boolean;
  hasResults: boolean;
  totalResults: number;
  clearSearch: () => void;
}

/**
 * Custom hook for managing student search state and functionality
 */
export function useStudentSearch({
  students,
  debounceMs = 300,
  maxResults = 50,
  minScore = 0
}: UseStudentSearchOptions): UseStudentSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, debounceMs]);

  // Memoized search results
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) {
      return [];
    }

    const searchOptions: SearchOptions = {
      searchQuery: debouncedQuery,
      maxResults,
      minScore
    };

    return searchStudents(students, searchOptions);
  }, [students, debouncedQuery, maxResults, minScore]);

  // Clear search functionality
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedStudent(null);
  }, []);

  // Update selected student when search changes
  useEffect(() => {
    if (selectedStudent && searchQuery) {
      // Check if selected student is still in filtered results
      const isStillVisible = filteredStudents.some(
        student => student.id === selectedStudent.id
      );
      
      if (!isStillVisible) {
        setSelectedStudent(null);
      }
    }
  }, [filteredStudents, selectedStudent, searchQuery]);

  // Reset selected student when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSelectedStudent(null);
    }
  }, [searchQuery]);

  const hasResults = filteredStudents.length > 0;
  const totalResults = filteredStudents.length;

  return {
    searchQuery,
    setSearchQuery,
    filteredStudents,
    selectedStudent,
    setSelectedStudent,
    isSearching,
    hasResults,
    totalResults,
    clearSearch
  };
}

/**
 * Hook for managing keyboard navigation in search results
 */
export function useKeyboardNavigation(
  filteredStudents: StudentSearchResult[],
  onSelect: (student: StudentSearchResult) => void,
  isOpen: boolean
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Reset focus when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Reset focus when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredStudents]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen || filteredStudents.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredStudents.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredStudents.length - 1
        );
        break;
        
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredStudents.length) {
          onSelect(filteredStudents[focusedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  }, [filteredStudents, focusedIndex, onSelect, isOpen]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
}

/**
 * Hook for managing search performance metrics
 */
export function useSearchMetrics(filteredStudents: StudentSearchResult[], searchQuery: string) {
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [lastSearchDuration, setLastSearchDuration] = useState<number | null>(null);

  useEffect(() => {
    if (searchQuery && !searchStartTime) {
      setSearchStartTime(Date.now());
    }
  }, [searchQuery, searchStartTime]);

  useEffect(() => {
    if (searchStartTime && filteredStudents.length >= 0) {
      setLastSearchDuration(Date.now() - searchStartTime);
      setSearchStartTime(null);
    }
  }, [filteredStudents, searchStartTime]);

  const avgScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const totalScore = filteredStudents.reduce((sum, student) => sum + student.score, 0);
    return Math.round(totalScore / filteredStudents.length);
  }, [filteredStudents]);

  return {
    lastSearchDuration,
    avgScore,
    resultCount: filteredStudents.length
  };
}