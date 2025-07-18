import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X, User, Building2, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useStudentSearch, useKeyboardNavigation } from '@/hooks/useStudentSearch';
import type { StudentSearchResult } from '@/services/studentSearchService';

export interface SearchableStudentSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  students: any[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable student dropdown component for enrollment modal
 * Drop-in replacement for basic Select component with enhanced search functionality
 */
export function SearchableStudentSelect({
  value,
  onValueChange,
  students,
  placeholder = "Search for a student...",
  disabled = false,
  className
}: SearchableStudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    setSearchQuery,
    filteredStudents,
    selectedStudent,
    setSelectedStudent,
    isSearching,
    hasResults,
    totalResults,
    clearSearch
  } = useStudentSearch({
    students,
    debounceMs: 300,
    maxResults: 100,
    minScore: 0
  });

  const {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  } = useKeyboardNavigation(filteredStudents, handleStudentSelect, isOpen);

  // Find currently selected student from value
  const currentStudent = students.find(student => student.id === value);

  // Handle student selection
  function handleStudentSelect(student: StudentSearchResult) {
    onValueChange(student.id);
    setSelectedStudent(student);
    setIsOpen(false);
    setSearchQuery('');
  }

  // Handle input click to open dropdown
  function handleInputClick() {
    if (disabled) return;
    setIsOpen(true);
    if (inputRef) {
      inputRef.focus();
    }
  }

  // Handle clear selection
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange('');
    setSelectedStudent(null);
    setSearchQuery('');
    setIsOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef) {
      inputRef.focus();
    }
  }, [isOpen, inputRef]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Main trigger button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "w-full justify-between text-left font-normal",
          !currentStudent && "text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={handleInputClick}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentStudent ? (
            <>
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{currentStudent.display_name}</span>
                <span className="text-xs text-muted-foreground truncate">{currentStudent.email}</span>
              </div>
            </>
          ) : (
            <>
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>{placeholder}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {currentStudent && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-muted"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </Button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-xl">
          {/* Search input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={setInputRef}
                type="text"
                placeholder="Type to search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                autoFocus
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Search status */}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {isSearching ? 'Searching...' : `${totalResults} students found`}
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  "{searchQuery}"
                </Badge>
              )}
            </div>
          </div>

          {/* Results list */}
          <ScrollArea className="h-[500px]">
            {hasResults ? (
              <div className="p-1">
                {filteredStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      focusedIndex === index && "bg-accent text-accent-foreground",
                      value === student.id && "bg-primary/10 text-primary"
                    )}
                    onClick={() => handleStudentSelect(student)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {/* Student avatar */}
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                    
                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">{student.display_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        
                        {student.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{student.company}</span>
                          </div>
                        )}
                        
                        {student.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{student.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Certification badges */}
                      {(student.first_aid_level || student.cpr_level) && (
                        <div className="flex gap-1 mt-1">
                          {student.first_aid_level && (
                            <Badge variant="secondary" className="text-xs">
                              {student.first_aid_level} FA
                            </Badge>
                          )}
                          {student.cpr_level && (
                            <Badge variant="secondary" className="text-xs">
                              CPR {student.cpr_level}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {value === student.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No students found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No students available</p>
                <p className="text-xs mt-1">Add students to enable enrollment</p>
              </div>
            ) : (
              <div className="p-1">
                {students.slice(0, 100).map((student, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      focusedIndex === index && "bg-accent text-accent-foreground",
                      value === student.id && "bg-primary/10 text-primary"
                    )}
                    onClick={() => handleStudentSelect(student)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {/* Student avatar */}
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                    
                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">{student.display_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        
                        {student.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{student.company}</span>
                          </div>
                        )}
                        
                        {student.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{student.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Certification badges */}
                      {(student.first_aid_level || student.cpr_level) && (
                        <div className="flex gap-1 mt-1">
                          {student.first_aid_level && (
                            <Badge variant="secondary" className="text-xs">
                              {student.first_aid_level} FA
                            </Badge>
                          )}
                          {student.cpr_level && (
                            <Badge variant="secondary" className="text-xs">
                              CPR {student.cpr_level}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {value === student.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default SearchableStudentSelect;