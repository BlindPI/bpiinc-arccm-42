
import { useLocationData } from '@/hooks/useLocationData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  disabled?: boolean;
}

export function LocationSelector({
  selectedLocationId,
  onLocationChange,
  disabled = false
}: LocationSelectorProps) {
  const { locations, isLoading } = useLocationData({ status: 'ACTIVE' });
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading locations...
      </div>
    );
  }
  
  return (
    <Select
      value={selectedLocationId}
      onValueChange={onLocationChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Location" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Location</SelectItem>
        {locations?.map(location => (
          <SelectItem key={location.id} value={location.id}>
            {location.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
