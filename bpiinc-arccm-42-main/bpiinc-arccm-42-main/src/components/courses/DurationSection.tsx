
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DurationSectionProps {
  expirationMonths: string;
  courseLength: string;
  onExpirationMonthsChange: (value: string) => void;
  onCourseLengthChange: (value: string) => void;
}

export function DurationSection({
  expirationMonths,
  courseLength,
  onExpirationMonthsChange,
  onCourseLengthChange,
}: DurationSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="expirationMonths" className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-gray-500" />
          Expiration Period
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="expirationMonths"
            type="number"
            min="1"
            value={expirationMonths}
            onChange={(e) => onExpirationMonthsChange(e.target.value)}
            required
            className="transition-colors focus:border-primary"
          />
          <span className="text-sm text-gray-500">months</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="courseLength" className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-gray-500" />
            Course Length
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Course length is used for automatic course matching in batch uploads
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="courseLength"
            type="number"
            min="1"
            value={courseLength}
            onChange={(e) => onCourseLengthChange(e.target.value)}
            className="transition-colors focus:border-primary"
            placeholder="Enter hours"
          />
          <span className="text-sm text-gray-500">hours</span>
        </div>
      </div>
    </div>
  );
}
