
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Check, Info, FileSpreadsheet } from 'lucide-react';
import { Course } from '@/types/supabase-schema';

interface CourseMatchDisplayProps {
  entry: {
    firstAidLevel?: string | null;
    cprLevel?: string | null;
    length?: number | null;
    issueDate?: string | null;
  };
  matchedCourse?: {
    id: string;
    name: string;
    matchType: 'exact' | 'partial' | 'default' | 'manual';
  };
  availableCourses: Course[];
  onCourseChange: (courseId: string) => void;
}

// Helper function for display - normalize CPR level for display
function normalizeCprLevel(cprLevel: string | undefined | null): string {
  if (!cprLevel) return '';
  return cprLevel.replace(/\s+\d+m\b/gi, '').trim();
}

export function CourseMatchDisplay({ 
  entry, 
  matchedCourse, 
  availableCourses,
  onCourseChange 
}: CourseMatchDisplayProps) {
  if (!matchedCourse) {
    // Handle case where no course match is available yet
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className="text-sm">Waiting for course match...</span>
      </div>
    );
  }

  // Prepare normalized CPR level for display
  const displayCprLevel = normalizeCprLevel(entry.cprLevel);

  const getMatchIcon = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'manual':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMatchDescription = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return 'Perfect match on First Aid Level, CPR Level, and course length';
      case 'partial':
        return 'Partial match based on available criteria';
      case 'manual':
        return 'Course selected from upload form';
      default:
        return 'No specific match found - using default course';
    }
  };

  const getMatchColor = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800/30';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30';
      case 'manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800/30';
    }
  };

  // Format the match type text for display
  const formatMatchType = (type: string) => {
    switch (type) {
      case 'exact': return 'Exact';
      case 'partial': return 'Partial';
      case 'default': return 'Default';
      case 'manual': return 'Manual';
      default: return type;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getMatchIcon()}
              <Badge 
                variant="outline"
                className={getMatchColor()}
              >
                {formatMatchType(matchedCourse.matchType)} Match
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-medium">{getMatchDescription()}</p>
            <div className="text-xs mt-1 space-y-1">
              {entry.firstAidLevel && <p>First Aid: {entry.firstAidLevel}</p>}
              {entry.cprLevel && <p>CPR: {displayCprLevel}</p>}
              {entry.length && <p>Length: {entry.length}h</p>}
              {entry.issueDate && <p>Issue Date: {new Date(entry.issueDate).toLocaleDateString()}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={matchedCourse.id}
        onValueChange={onCourseChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a course...">
            {matchedCourse.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableCourses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              <div className="flex flex-col">
                <span className="font-medium">{course.name}</span>
                <div className="text-xs text-muted-foreground">
                  {course.first_aid_level && `FA: ${course.first_aid_level}`} 
                  {course.cpr_level && ` | CPR: ${normalizeCprLevel(course.cpr_level)}`}
                  {course.length && ` | ${course.length}h`}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
