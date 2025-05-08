
import { useCourseTypes } from '@/hooks/useCourseTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CourseTypeSelectorProps {
  selectedCourseTypeId: string;
  setSelectedCourseTypeId: (value: string) => void;
}

export function CourseTypeSelector({
  selectedCourseTypeId,
  setSelectedCourseTypeId
}: CourseTypeSelectorProps) {
  const { courseTypes, isLoading: courseTypesLoading } = useCourseTypes();
  
  // Filter active course types
  const activeCourseTypes = courseTypes.filter(type => type.active);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Course Type</label>
      <Select
        value={selectedCourseTypeId}
        onValueChange={setSelectedCourseTypeId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Course Type" />
        </SelectTrigger>
        <SelectContent>
          {courseTypesLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : activeCourseTypes.length === 0 ? (
            <SelectItem value="none" disabled>No course types available</SelectItem>
          ) : (
            activeCourseTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
