
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  name: string;
  expiration_months: number;
}

interface CourseSelectorProps {
  selectedCourseId: string;
  onCourseSelect: (courseId: string) => void;
}

export function CourseSelector({ selectedCourseId, onCourseSelect }: CourseSelectorProps) {
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, expiration_months')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      return data as Course[];
    },
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="course">Course</Label>
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
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
