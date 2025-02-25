
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCourseData } from '@/hooks/useCourseData';
import { BookOpen } from 'lucide-react';

interface CourseSelectorProps {
  selectedCourseId: string;
  onCourseSelect: (courseId: string) => void;
}

export function CourseSelector({ selectedCourseId, onCourseSelect }: CourseSelectorProps) {
  const { data: courses } = useCourseData();

  return (
    <div className="space-y-2">
      <Label htmlFor="course" className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-gray-500" />
        Course
      </Label>
      <Select 
        value={selectedCourseId} 
        onValueChange={onCourseSelect}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a course" />
        </SelectTrigger>
        <SelectContent>
          {courses?.map((course) => (
            <SelectItem key={course.id} value={course.id} className="flex flex-col items-start py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({course.expiration_months} {course.expiration_months === 1 ? 'month' : 'months'})
                  </span>
                </div>
                {course.description && (
                  <span className="text-sm text-muted-foreground block">{course.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
