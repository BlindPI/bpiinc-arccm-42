
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
import { useAssessmentTypes } from '@/hooks/useAssessmentTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface AssessmentTypeSectionProps {
  assessmentTypeId: string;
  onAssessmentTypeChange: (value: string) => void;
}

export function AssessmentTypeSection({
  assessmentTypeId,
  onAssessmentTypeChange,
}: AssessmentTypeSectionProps) {
  const { assessmentTypes, isLoading } = useAssessmentTypes();
  
  // Filter for only active assessment types
  const activeAssessmentTypes = assessmentTypes.filter(type => type.active);

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Assessment Method</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Select how this course will be assessed.
                  Different assessment types may require different resources and preparation.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose an assessment method for this course
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assessmentType" className="flex items-center gap-2">
          Assessment Method
        </Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={assessmentTypeId || ""} 
            onValueChange={onAssessmentTypeChange}
          >
            <SelectTrigger id="assessmentType">
              <SelectValue placeholder="Select Assessment Type" />
            </SelectTrigger>
            <SelectContent>
              {activeAssessmentTypes.length === 0 ? (
                <SelectItem value="none" disabled>No assessment types available</SelectItem>
              ) : (
                <>
                  <SelectItem value="none">None</SelectItem>
                  {activeAssessmentTypes.map((type) => (
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
