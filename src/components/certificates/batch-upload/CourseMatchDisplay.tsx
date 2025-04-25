
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { Course } from '@/types/supabase-schema';

interface CourseMatchDisplayProps {
  entry: {
    firstAidLevel?: string;
    cprLevel?: string;
    length?: number;
  };
  matchedCourse?: {
    id: string;
    name: string;
    matchType: 'exact' | 'partial' | 'default';
  };
  availableCourses: Course[];
  onCourseChange: (courseId: string) => void;
}

export function CourseMatchDisplay({ 
  entry, 
  matchedCourse, 
  availableCourses,
  onCourseChange 
}: CourseMatchDisplayProps) {
  const getMatchIcon = () => {
    switch (matchedCourse?.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMatchDescription = () => {
    switch (matchedCourse?.matchType) {
      case 'exact':
        return 'Perfect match on First Aid Level, CPR Level, and course length';
      case 'partial':
        return 'Partial match based on available criteria';
      default:
        return 'No specific match found - select a course';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getMatchIcon()}
              <Badge 
                variant={
                  matchedCourse?.matchType === 'exact' ? 'default' : 
                  matchedCourse?.matchType === 'partial' ? 'secondary' : 
                  'outline'
                }
              >
                {matchedCourse?.matchType || 'Select Course'}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{getMatchDescription()}</p>
            {entry.firstAidLevel && <p className="text-xs">First Aid: {entry.firstAidLevel}</p>}
            {entry.cprLevel && <p className="text-xs">CPR: {entry.cprLevel}</p>}
            {entry.length && <p className="text-xs">Length: {entry.length}h</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={matchedCourse?.id}
        onValueChange={onCourseChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a course..." />
        </SelectTrigger>
        <SelectContent>
          {availableCourses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
