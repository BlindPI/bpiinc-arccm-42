import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';

interface StudentCourseAssignmentProps {
  rosterId: string;
}

export function StudentCourseAssignment({ rosterId }: StudentCourseAssignmentProps) {
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch roster students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['roster-students', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_roster_members')
        .select(`
          id,
          student_profile_id,
          course_id,
          enrollment_status,
          student_enrollment_profiles!inner(
            display_name,
            email
          )
        `)
        .eq('roster_id', rosterId);

      if (error) throw error;
      return data;
    }
  });

  // Fetch available courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['active-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description, status')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Update student course assignment
  const updateMutation = useMutation({
    mutationFn: async ({ studentMemberId, courseId }: { studentMemberId: string; courseId: string }) => {
      const { error } = await supabase
        .from('student_roster_members')
        .update({ course_id: courseId })
        .eq('id', studentMemberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Student course assignment updated');
      queryClient.invalidateQueries({ queryKey: ['roster-students', rosterId] });
    },
    onError: (error) => {
      console.error('Error updating course assignment:', error);
      toast.error('Failed to update course assignment');
    }
  });

  const handleCourseChange = (studentMemberId: string, courseId: string) => {
    setSelectedCourses(prev => ({ ...prev, [studentMemberId]: courseId }));
    updateMutation.mutate({ studentMemberId, courseId });
  };

  if (studentsLoading || coursesLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Assign Courses to Students</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Course</TableHead>
            <TableHead>Assign Course</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students?.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {student.student_enrollment_profiles?.display_name}
              </TableCell>
              <TableCell>
                {student.student_enrollment_profiles?.email}
              </TableCell>
              <TableCell>
                {student.course_id ? 
                  courses?.find(c => c.id === student.course_id)?.name || 'Unknown Course' : 
                  'No course assigned'
                }
              </TableCell>
              <TableCell>
                <Select 
                  value={selectedCourses[student.id] || student.course_id || ''}
                  onValueChange={(value) => handleCourseChange(student.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{course.name}</span>
                          {course.description && (
                            <span className="text-sm text-muted-foreground">
                              {course.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  student.enrollment_status === 'completed' ? 'bg-green-100 text-green-800' :
                  student.enrollment_status === 'enrolled' ? 'bg-blue-100 text-blue-800' :
                  student.enrollment_status === 'dropped' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {student.enrollment_status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {students?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No students found in this roster.
        </div>
      )}
    </div>
  );
}