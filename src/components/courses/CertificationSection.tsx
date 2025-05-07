
import { Label } from '@/components/ui/label';
import { ActivitySquare, Award, Info } from 'lucide-react';
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
import { useCertificationLevels } from '@/hooks/useCertificationLevels';
import { Skeleton } from '@/components/ui/skeleton';

interface CertificationSectionProps {
  firstAidLevel: string;
  cprLevel: string;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
}

export function CertificationSection({
  firstAidLevel,
  cprLevel,
  onFirstAidLevelChange,
  onCprLevelChange,
}: CertificationSectionProps) {
  const { 
    certificationLevels: firstAidLevels, 
    isLoading: firstAidLoading 
  } = useCertificationLevels('FIRST_AID');
  
  const { 
    certificationLevels: cprLevels, 
    isLoading: cprLoading 
  } = useCertificationLevels('CPR');

  // Filter for only active levels
  const activeFirstAidLevels = firstAidLevels.filter(level => level.active);
  const activeCprLevels = cprLevels.filter(level => level.active);

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Certification Details</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  These fields are used for automatic course matching when processing roster uploads.
                  Setting them correctly helps connect students to the right courses.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Specify certification levels for automatic course matching
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="space-y-2">
          <Label htmlFor="firstAidLevel" className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-500" />
            First Aid Level
          </Label>
          {firstAidLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={firstAidLevel} 
              onValueChange={onFirstAidLevelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select First Aid Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {activeFirstAidLevels.map((level) => (
                  <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cprLevel" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4 text-gray-500" />
            CPR Level
          </Label>
          {cprLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={cprLevel} 
              onValueChange={onCprLevelChange}
            >
              <SelectTrigger id="cprLevel" className="w-full">
                <SelectValue placeholder="Select CPR Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {activeCprLevels.map((level) => (
                  <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
