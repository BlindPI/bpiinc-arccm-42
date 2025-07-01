
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCourseData } from '@/hooks/useCourseData';
import { BookOpen, Loader2 } from 'lucide-react';

interface CourseSelectorProps {
  selectedCourseId: string;
  onCourseSelect: (courseId: string) => void;
  label?: string;
  className?: string;
}

export function CourseSelector({
  selectedCourseId,
  onCourseSelect,
  label = "Select Course",
  className
}: CourseSelectorProps) {
  const { data: courses, isLoading } = useCourseData();

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor="course-select" className="text-sm font-medium">{label}</Label>
      <Select value={selectedCourseId} onValueChange={onCourseSelect}>
        <SelectTrigger id="course-select" className="w-full bg-white dark:bg-secondary">
          <SelectValue placeholder="Choose a course..." />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </SelectItem>
          ) : courses && courses.length > 0 ? (
            courses.map((course) => (
              <SelectItem key={course.id} value={course.id} className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{course.name}</span>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-courses" disabled>No courses available</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
