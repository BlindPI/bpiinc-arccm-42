
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, ActivitySquare, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define valid levels
export const VALID_FIRST_AID_LEVELS = [
  'Standard First Aid',
  'Emergency First Aid',
  'Recertification: Standard',
  'Recertification: Emergency',
  'Instructor: Standard',
  'Instructor: Emergency'
];

export const VALID_CPR_LEVELS = [
  'CPR A w/AED',
  'CPR C w/AED',
  'CPR BLS w/AED',
  'CPR BLS w/AED 24m'
];

interface CertificationLevelSectionProps {
  firstAidLevel: string;
  cprLevel: string;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
}

export function CertificationLevelSection({
  firstAidLevel,
  cprLevel,
  onFirstAidLevelChange,
  onCprLevelChange
}: CertificationLevelSectionProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-medium">Certification Levels</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                These fields help with certificate request matching
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstAidLevel" className="flex items-center gap-2">
            <Award className="h-4 w-4 text-green-500" />
            First Aid Level
          </Label>
          <Select 
            value={firstAidLevel} 
            onValueChange={onFirstAidLevelChange}
          >
            <SelectTrigger id="firstAidLevel">
              <SelectValue placeholder="Select First Aid Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {VALID_FIRST_AID_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cprLevel" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4 text-orange-500" />
            CPR Level
          </Label>
          <Select 
            value={cprLevel} 
            onValueChange={onCprLevelChange}
          >
            <SelectTrigger id="cprLevel">
              <SelectValue placeholder="Select CPR Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {VALID_CPR_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
