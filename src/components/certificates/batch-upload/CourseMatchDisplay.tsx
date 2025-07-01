
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Check, Info, FileSpreadsheet } from 'lucide-react';
import { Course } from '@/types/courses';
import { CourseMatchType } from '../types';

interface CourseMatchDisplayProps {
  entry: {
    firstAidLevel?: string | null;
    cprLevel?: string | null;
    length?: number | null;
    issueDate?: string | null;
    certifications?: Record<string, string>;
  };
  matchedCourse?: {
    id: string;
    name: string;
    matchType: CourseMatchType;
    certifications?: Array<{
      type: string;
      level: string;
    }>;
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
  if (!matchedCourse) {
    // Handle case where no course match is available yet
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className="text-sm">Waiting for course match...</span>
      </div>
    );
  }
  
  const getMatchIcon = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'manual':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMatchDescription = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return 'Combined match - both First Aid and CPR levels matched exactly';
      case 'partial':
        return 'Single certification match - either First Aid or CPR level matched';
      case 'manual':
        return 'Course selected manually';
      default:
        return 'Using default course';
    }
  };

  const getMatchColor = () => {
    switch (matchedCourse.matchType) {
      case 'exact':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800/30';
      case 'partial':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800/30';
      case 'manual':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800/30';
    }
  };

  // Format the match type text for display
  const formatMatchType = (type: string) => {
    switch (type) {
      case 'exact': return 'Combined';
      case 'partial': return 'Partial';
      case 'default': return 'Default';
      case 'manual': return 'Manual';
      case 'fallback': return 'Fallback';
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
          <TooltipContent className="max-w-xs bg-white border border-gray-100 p-3 shadow-lg rounded-lg">
            <p className="text-sm font-medium text-gray-900">{getMatchDescription()}</p>
            <div className="text-xs mt-2 space-y-1 text-gray-600">
              <div className="border-b pb-2 border-gray-200">
                <p className="font-medium">Student information:</p>
                {entry.firstAidLevel && <p>First Aid: {entry.firstAidLevel}</p>}
                {entry.cprLevel && <p>CPR: {entry.cprLevel}</p>}
                {entry.length && <p>Length: {entry.length}h</p>}
              </div>
              
              {/* Display matched course certification values */}
              {matchedCourse.certifications && matchedCourse.certifications.length > 0 && (
                <div className="pt-1">
                  <p className="font-medium">Course certifications:</p>
                  <ul className="list-disc pl-4 mt-1">
                    {matchedCourse.certifications.map((cert, i) => (
                      <li key={i}>{cert.type}: {cert.level}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={matchedCourse.id}
        onValueChange={onCourseChange}
      >
        <SelectTrigger className="w-full min-h-[44px] bg-white text-secondary border-blue-200 hover:border-blue-400 focus:border-blue-500">
          <SelectValue placeholder="Select a course">
            <span className="block truncate pr-4">{matchedCourse.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className="bg-white border-blue-100 shadow-lg w-[350px] max-h-[300px]"
          position="popper"
          align="start"
        >
          {availableCourses.map((course) => (
            <SelectItem 
              key={course.id} 
              value={course.id}
              className="py-3 px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium text-secondary">{course.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-1">
                  {course.first_aid_level && (
                    <span className="bg-blue-50 text-blue-700 px-1 rounded">
                      FA: {course.first_aid_level}
                    </span>
                  )} 
                  {course.cpr_level && (
                    <span className="bg-green-50 text-green-700 px-1 rounded">
                      CPR: {course.cpr_level}
                    </span>
                  )}
                  {course.length && (
                    <span className="bg-gray-50 text-gray-700 px-1 rounded">
                      {course.length}h
                    </span>
                  )}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
