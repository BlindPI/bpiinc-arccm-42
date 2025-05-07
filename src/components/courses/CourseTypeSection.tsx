
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourseTypes } from '@/hooks/useCourseTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseTypeSectionProps {
  courseTypeId: string;
  onCourseTypeChange: (value: string) => void;
}

export function CourseTypeSection({
  courseTypeId,
  onCourseTypeChange,
}: CourseTypeSectionProps) {
  const { courseTypes, isLoading } = useCourseTypes();
  
  // Filter for only active course types
  const activeCourseTypes = courseTypes.filter(type => type.active);

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Course Type</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Select the course type that best describes this course. 
                  This helps with course categorization and matching.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a course type for categorization
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="courseType" className="flex items-center gap-2">
          Course Type
        </Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={courseTypeId || ''} 
            onValueChange={onCourseTypeChange}
          >
            <SelectTrigger id="courseType">
              <SelectValue placeholder="Select Course Type" />
            </SelectTrigger>
            <SelectContent>
              {activeCourseTypes.length === 0 ? (
                <SelectItem value="" disabled>No course types available</SelectItem>
              ) : (
                <>
                  <SelectItem value="">None</SelectItem>
                  {activeCourseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
