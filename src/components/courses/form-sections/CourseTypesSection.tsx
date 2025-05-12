
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourseTypes } from '@/hooks/useCourseTypes';
import { useAssessmentTypes } from '@/hooks/useAssessmentTypes';

interface CourseTypesSectionProps {
  courseTypeId: string;
  assessmentTypeId: string;
  onCourseTypeChange: (value: string) => void;
  onAssessmentTypeChange: (value: string) => void;
}

export function CourseTypesSection({
  courseTypeId,
  assessmentTypeId,
  onCourseTypeChange,
  onAssessmentTypeChange
}: CourseTypesSectionProps) {
  // Get course types and assessment types
  const { courseTypes, isLoading: courseTypesLoading } = useCourseTypes();
  const { assessmentTypes, isLoading: assessmentTypesLoading } = useAssessmentTypes();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="courseType">Course Type</Label>
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
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assessmentType">Assessment Type</Label>
        <Select 
          value={assessmentTypeId} 
          onValueChange={onAssessmentTypeChange}
          disabled={assessmentTypesLoading}
        >
          <SelectTrigger id="assessmentType">
            <SelectValue placeholder="Select Assessment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {assessmentTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
