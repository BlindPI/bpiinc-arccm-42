
import { useState, useEffect } from 'react';
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
import { useCourseTypeCertificationLevels } from '@/hooks/useCourseTypeCertificationLevels';
import { Skeleton } from '@/components/ui/skeleton';

interface CertificationSectionProps {
  firstAidLevel: string;
  cprLevel: string;
  courseTypeId?: string;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
}

export function CertificationSection({
  firstAidLevel,
  cprLevel,
  courseTypeId,
  onFirstAidLevelChange,
  onCprLevelChange,
}: CertificationSectionProps) {
  const [availableCertTypes, setAvailableCertTypes] = useState<Record<string, boolean>>({
    'FIRST_AID': true,
    'CPR': true
  });
  
  // Get all certification levels
  const { 
    certificationLevels: allCertificationLevels, 
    isLoading: allLevelsLoading 
  } = useCertificationLevels();
  
  // Get the course type's associated certification levels
  const {
    relationships,
    isLoading: relationshipsLoading
  } = useCourseTypeCertificationLevels(courseTypeId);
  
  useEffect(() => {
    if (relationships && relationships.length > 0) {
      // Identify the available certification types for this course type
      const types = relationships.reduce((acc: Record<string, boolean>, curr) => {
        if (curr.certification_level?.type) {
          acc[curr.certification_level.type] = true;
        }
        return acc;
      }, {});
      
      setAvailableCertTypes(types);
    } else if (courseTypeId) {
      // If no relationships are defined but a course type is selected,
      // assume no certification levels are available
      setAvailableCertTypes({});
    } else {
      // If no course type is selected, show all certification types
      setAvailableCertTypes({
        'FIRST_AID': true,
        'CPR': true
      });
    }
  }, [relationships, courseTypeId]);
  
  // Group certification levels by type
  const certificationLevelsByType = allCertificationLevels.reduce((acc: Record<string, any[]>, level) => {
    if (!acc[level.type]) acc[level.type] = [];
    if (level.active) acc[level.type].push(level);
    return acc;
  }, {});

  const isLoading = allLevelsLoading || relationshipsLoading;
  
  // If no certification types are available and a course type is selected, return null
  if (courseTypeId && Object.keys(availableCertTypes).length === 0) {
    return null;
  }

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
        {availableCertTypes['FIRST_AID'] && (
          <div className="space-y-2">
            <Label htmlFor="firstAidLevel" className="flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              First Aid Level
            </Label>
            {isLoading ? (
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
                  {certificationLevelsByType['FIRST_AID']?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        
        {availableCertTypes['CPR'] && (
          <div className="space-y-2">
            <Label htmlFor="cprLevel" className="flex items-center gap-2">
              <ActivitySquare className="h-4 w-4 text-gray-500" />
              CPR Level
            </Label>
            {isLoading ? (
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
                  {certificationLevelsByType['CPR']?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        
        {/* Render other certification types dynamically */}
        {Object.keys(availableCertTypes).filter(type => type !== 'FIRST_AID' && type !== 'CPR').map(type => (
          <div key={type} className="space-y-2">
            <Label htmlFor={`cert-${type}`} className="flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              {type} Level
            </Label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select>
                <SelectTrigger id={`cert-${type}`}>
                  <SelectValue placeholder={`Select ${type} Level`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {certificationLevelsByType[type]?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
