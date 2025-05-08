
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CertificationSectionProps {
  firstAidLevel: string;
  cprLevel: string;
  courseTypeId?: string;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
  certificationValues?: Record<string, string>;
  onCertificationValueChange?: (type: string, value: string) => void;
}

// Component to create a certification level selector
const CertificationLevelSelector = ({
  type,
  value,
  onChange,
  levels,
  isLoading = false,
  icon = Award,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
  levels: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  // Format the type for display in the UI
  const formatTypeForDisplay = (typeString: string) => {
    return typeString.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const IconComponent = icon;

  return (
    <div className="space-y-2">
      <Label htmlFor={`cert-${type}`} className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-gray-500" />
        {formatTypeForDisplay(type)} Level
      </Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Select 
          value={value} 
          onValueChange={onChange}
        >
          <SelectTrigger id={`cert-${type}`} className="w-full">
            <SelectValue placeholder={`Select ${formatTypeForDisplay(type)} Level`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export function CertificationSection({
  firstAidLevel,
  cprLevel,
  courseTypeId,
  onFirstAidLevelChange,
  onCprLevelChange,
  certificationValues = {},
  onCertificationValueChange,
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
      const allTypes = allCertificationLevels.reduce((acc: Record<string, boolean>, level) => {
        acc[level.type] = true;
        return acc;
      }, {});
      
      setAvailableCertTypes(allTypes);
    }
  }, [relationships, courseTypeId, allCertificationLevels]);
  
  // Group certification levels by type
  const certificationLevelsByType = allCertificationLevels.reduce((acc: Record<string, any[]>, level) => {
    if (!level.type) return acc;
    if (!acc[level.type]) acc[level.type] = [];
    if (level.active) acc[level.type].push(level);
    return acc;
  }, {});

  const isLoading = allLevelsLoading || relationshipsLoading;

  // If no certification types are available and a course type is selected, show a message
  if (courseTypeId && Object.keys(availableCertTypes).length === 0) {
    return (
      <div className="space-y-3 border-t pt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Certification Details</h3>
          </div>
        
          <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertDescription>
              No certification levels are associated with this course type. Please associate certification levels with this course type in the Course Settings page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
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
        {/* Always show FIRST_AID and CPR if available for backward compatibility */}
        {availableCertTypes['FIRST_AID'] && (
          <CertificationLevelSelector
            type="FIRST_AID"
            value={firstAidLevel}
            onChange={onFirstAidLevelChange}
            levels={certificationLevelsByType['FIRST_AID'] || []}
            isLoading={isLoading}
            icon={Award}
          />
        )}
        
        {availableCertTypes['CPR'] && (
          <CertificationLevelSelector
            type="CPR"
            value={cprLevel}
            onChange={onCprLevelChange}
            levels={certificationLevelsByType['CPR'] || []}
            isLoading={isLoading}
            icon={ActivitySquare}
          />
        )}
        
        {/* Render other certification types dynamically */}
        {Object.keys(availableCertTypes)
          .filter(type => type !== 'FIRST_AID' && type !== 'CPR')
          .map(type => {
            const currentValue = certificationValues?.[type] || "none";
            const handleChange = (value: string) => {
              if (onCertificationValueChange) {
                onCertificationValueChange(type, value);
              }
            };
            
            return (
              <CertificationLevelSelector
                key={type}
                type={type}
                value={currentValue}
                onChange={handleChange}
                levels={certificationLevelsByType[type] || []}
                isLoading={isLoading}
              />
            );
          })}
      </div>
    </div>
  );
}
