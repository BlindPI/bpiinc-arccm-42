
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, X, Award } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Common certification types
export const COMMON_CERTIFICATION_TYPES = [
  'INSTRUCTOR',
  'WILDERNESS',
  'MARINE',
  'SPECIALIZED',
  'RECERTIFICATION',
  'PEDIATRIC'
];

interface CertificationEntry {
  type: string;
  value: string;
}

interface AdditionalCertificationsSectionProps {
  certificationValues?: Record<string, string>;
  onCertificationValuesChange: (values: Record<string, string>) => void;
}

export function AdditionalCertificationsSection({
  certificationValues = {},
  onCertificationValuesChange
}: AdditionalCertificationsSectionProps) {
  const [newCertificationType, setNewCertificationType] = useState('');
  const [newCertificationValue, setNewCertificationValue] = useState('');
  const [customType, setCustomType] = useState('');

  // Filter out FIRST_AID and CPR since they're handled separately
  const filteredCertificationValues = Object.entries(certificationValues)
    .filter(([type]) => type !== 'FIRST_AID' && type !== 'CPR')
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  
  const handleAddCertification = () => {
    const certType = newCertificationType === 'CUSTOM' ? customType.toUpperCase() : newCertificationType;
    
    if (!certType || !newCertificationValue) {
      return;
    }
    
    const updatedValues = {
      ...certificationValues,
      [certType]: newCertificationValue
    };
    
    onCertificationValuesChange(updatedValues);
    setNewCertificationType('');
    setNewCertificationValue('');
    setCustomType('');
  };
  
  const handleRemoveCertification = (type: string) => {
    const { [type]: _, ...remainingValues } = certificationValues;
    onCertificationValuesChange(remainingValues);
  };
  
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Additional Certifications</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Add other certification types/values for more accurate course matching
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* List current certification values */}
      {Object.keys(filteredCertificationValues).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(filteredCertificationValues).map(([type, value]) => (
            <Badge 
              key={type} 
              className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200"
            >
              <span className="font-semibold">{type}:</span>
              <span>{value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1 hover:bg-blue-100"
                onClick={() => handleRemoveCertification(type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Add new certification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="certType">Certification Type</Label>
          <Select
            value={newCertificationType}
            onValueChange={setNewCertificationType}
          >
            <SelectTrigger id="certType" className="w-full">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CERTIFICATION_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ')}
                </SelectItem>
              ))}
              <SelectItem value="CUSTOM">Custom Type...</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {newCertificationType === 'CUSTOM' && (
          <div className="space-y-2">
            <Label htmlFor="customType">Custom Type</Label>
            <Input
              id="customType"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="E.g., ADVANCED_WATER"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="certValue">Certification Value</Label>
          <Input
            id="certValue"
            value={newCertificationValue}
            onChange={(e) => setNewCertificationValue(e.target.value)}
            placeholder="E.g., Level 1, Basic, Advanced"
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 self-end mb-[2px]"
          onClick={handleAddCertification}
          disabled={!newCertificationValue || (!newCertificationType || (newCertificationType === 'CUSTOM' && !customType))}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
