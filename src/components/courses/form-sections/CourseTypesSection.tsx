
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourseTypes } from '@/hooks/useCourseTypes';

interface CourseTypesSectionProps {
  courseTypeId: string;
  onCourseTypeChange: (value: string) => void;
}

export function CourseTypesSection({
  courseTypeId,
  onCourseTypeChange
}: CourseTypesSectionProps) {
  // Get course types
  const { courseTypes, isLoading: courseTypesLoading } = useCourseTypes();
  
  return (
    <div className="space-y-2">
      <Label htmlFor="courseType">Course Type (Optional)</Label>
      <Select 
        value={courseTypeId} 
        onValueChange={onCourseTypeChange}
        disabled={courseTypesLoading}
      >
        <SelectTrigger id="courseType">
          <SelectValue placeholder="Select Course Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {courseTypes.map(type => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Course type is optional and primarily used for organizational purposes
      </p>
    </div>
  );
}
