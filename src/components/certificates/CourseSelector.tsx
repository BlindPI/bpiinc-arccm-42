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
  const {
    data: courses
  } = useCourseData();
  return;
}