
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Plus, X } from 'lucide-react';
import { CoursePrerequisite } from '@/types/enrollment';

export function CoursePrerequisites({ courseId }: { courseId: string }) {
  const [selectedPrerequisite, setSelectedPrerequisite] = useState<string>('');
  const [isRequired, setIsRequired] = useState(true);
  const queryClient = useQueryClient();
  
  // Fetch all courses for the dropdown
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch prerequisites for this course
  const { data: prerequisites } = useQuery({
    queryKey: ['course-prerequisites', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .select(`
          *,
          prerequisite_courses:prerequisite_course_id(name)
        `)
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data as Array<CoursePrerequisite & {
        prerequisite_courses: { name: string };
      }>;
    },
    enabled: !!courseId,
  });
  
  // Add a prerequisite
  const addPrerequisite = useMutation({
    mutationFn: async () => {
      if (!selectedPrerequisite) {
        throw new Error('Please select a prerequisite course');
      }
      
      const { data, error } = await supabase
        .from('course_prerequisites')
        .insert([{
          course_id: courseId,
          prerequisite_course_id: selectedPrerequisite,
          is_required: isRequired
        }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-prerequisites', courseId] });
      setSelectedPrerequisite('');
      toast.success('Prerequisite added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add prerequisite: ${error.message}`);
    }
  });
  
  // Remove a prerequisite
  const removePrerequisite = useMutation({
    mutationFn: async (prerequisiteId: string) => {
      const { error } = await supabase
        .from('course_prerequisites')
        .delete()
        .eq('id', prerequisiteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-prerequisites', courseId] });
      toast.success('Prerequisite removed');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove prerequisite: ${error.message}`);
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Course Prerequisites</CardTitle>
        <CardDescription>
          Set required or recommended courses that should be completed before this one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new prerequisite */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-grow">
              <Select
                value={selectedPrerequisite}
                onValueChange={setSelectedPrerequisite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prerequisite course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.filter(c => c.id !== courseId).map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <label
                htmlFor="is-required"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Required
              </label>
            </div>
            
            <Button
              onClick={() => addPrerequisite.mutate()}
              disabled={!selectedPrerequisite || addPrerequisite.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {/* List of prerequisites */}
          {prerequisites?.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
              <p>No prerequisites set for this course</p>
            </div>
          )}
          
          <div className="space-y-2">
            {prerequisites?.map((prereq) => (
              <div key={prereq.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  {prereq.is_required ? (
                    <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      Required
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  <span>{prereq.prerequisite_courses.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrerequisite.mutate(prereq.id)}
                  disabled={removePrerequisite.isPending}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
