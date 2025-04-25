
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCourseData } from '@/hooks/useCourseData';
import { BookOpen } from 'lucide-react';

interface CourseSelectorProps {
  selectedCourseId: string;
  onCourseSelect: (courseId: string) => void;
}

export function CourseSelector({
  selectedCourseId,
  onCourseSelect
}: CourseSelectorProps) {
  const { data: courses } = useCourseData();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="course-select" className="text-sm font-medium">Select Course</Label>
      <Select value={selectedCourseId} onValueChange={onCourseSelect}>
        <SelectTrigger id="course-select" className="w-full bg-white dark:bg-secondary">
          <SelectValue placeholder="Choose a course..." />
        </SelectTrigger>
        <SelectContent>
          {courses?.map((course) => (
            <SelectItem key={course.id} value={course.id} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{course.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
