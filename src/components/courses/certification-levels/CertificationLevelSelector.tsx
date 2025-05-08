
import { useCertificationLevels } from '@/hooks/useCertificationLevels';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';

interface CertificationLevelSelectorProps {
  selectedCertificationLevelId: string;
  setSelectedCertificationLevelId: (value: string) => void;
  onAddAssociation: () => void;
  isAdding: boolean;
  disabled?: boolean;
}

export function CertificationLevelSelector({
  selectedCertificationLevelId,
  setSelectedCertificationLevelId,
  onAddAssociation,
  isAdding,
  disabled = false
}: CertificationLevelSelectorProps) {
  const { certificationLevels, isLoading: certificationLevelsLoading } = useCertificationLevels();
  
  // Filter active certification levels
  const activeCertificationLevels = certificationLevels.filter(level => level.active);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Add Certification Level</label>
      <div className="flex gap-2">
        <Select
          value={selectedCertificationLevelId}
          onValueChange={setSelectedCertificationLevelId}
          disabled={certificationLevelsLoading || disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select Certification Level" />
          </SelectTrigger>
          <SelectContent>
            {certificationLevelsLoading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : activeCertificationLevels.length === 0 ? (
              <SelectItem value="none" disabled>No certification levels available</SelectItem>
            ) : (
              activeCertificationLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>{level.name} ({level.type})</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button 
          onClick={onAddAssociation}
          disabled={!selectedCertificationLevelId || isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
