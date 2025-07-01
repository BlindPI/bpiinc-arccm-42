
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Timer, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DurationFieldsProps {
  expirationMonths: string;
  courseLength: string;
  onExpirationMonthsChange: (value: string) => void;
  onCourseLengthChange: (value: string) => void;
}

export function DurationFields({
  expirationMonths,
  courseLength,
  onExpirationMonthsChange,
  onCourseLengthChange
}: DurationFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="expirationMonths" className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-gray-500" />
          Expiration Period (months) *
        </Label>
        <Input
          id="expirationMonths"
          type="number"
          min="1"
          value={expirationMonths}
          onChange={(e) => onExpirationMonthsChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="courseLength" className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-gray-500" />
            Course Length (hours)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Course length is used for automatic matching in certificate requests
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="courseLength"
          type="number"
          min="1"
          value={courseLength}
          onChange={(e) => onCourseLengthChange(e.target.value)}
          placeholder="Enter hours"
        />
      </div>
    </div>
  );
}
