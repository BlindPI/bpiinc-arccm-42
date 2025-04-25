
import { CourseSelector } from '../CourseSelector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FormFieldsProps {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enabled: boolean) => void;
  disabled?: boolean;
}

export function FormFields({
  selectedCourseId,
  setSelectedCourseId,
  issueDate,
  setIssueDate,
  enableCourseMatching,
  setEnableCourseMatching,
  disabled = false
}: FormFieldsProps) {
  return (
    <Card className="bg-white/70 dark:bg-secondary/70 border border-card shadow-sm">
      <CardContent className="p-6 space-y-4">
        <CourseSelector 
          selectedCourseId={selectedCourseId} 
          onCourseSelect={setSelectedCourseId} 
        />

        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="course-matching"
            checked={enableCourseMatching}
            onCheckedChange={setEnableCourseMatching}
            disabled={disabled}
          />
          <Label htmlFor="course-matching" className="text-sm font-medium">
            Enable Course Matching
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  When enabled, the system will try to match each entry's First Aid and CPR levels to 
                  the appropriate course. The selected course will be used as default when no match is found.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div>
          <Label htmlFor="issueDate" className="text-sm font-medium">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="mt-1.5"
            disabled={disabled}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}
