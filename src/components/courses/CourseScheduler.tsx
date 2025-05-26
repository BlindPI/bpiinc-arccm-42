
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CourseSchedulingService } from '@/services/courses/courseSchedulingService';
import { supabase } from '@/integrations/supabase/client';
import type { CourseSchedule, ConflictResult } from '@/types/courseScheduling';

const scheduleFormSchema = z.object({
  course_id: z.string().min(1, 'Course is required'),
  instructor_id: z.string().min(1, 'Instructor is required'),
  location_id: z.string().min(1, 'Location is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  max_capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

export interface CourseSchedulerProps {
  courseId?: string;
  onScheduleCreated?: (schedule: CourseSchedule) => void;
}

export const CourseScheduler: React.FC<CourseSchedulerProps> = ({ 
  courseId, 
  onScheduleCreated 
}) => {
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      course_id: courseId || '',
      instructor_id: '',
      location_id: '',
      start_date: '',
      end_date: '',
      max_capacity: 20,
    },
  });

  // Get available courses
  const { data: courses } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get instructors (users with instructor roles)
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['IC', 'IP', 'IT'])
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get locations
  const { data: locations } = useQuery({
    queryKey: ['locations', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Check for conflicts when instructor or dates change
  const watchedValues = form.watch(['instructor_id', 'start_date', 'end_date']);
  
  React.useEffect(() => {
    const [instructorId, startDate, endDate] = watchedValues;
    
    if (instructorId && startDate && endDate) {
      CourseSchedulingService.checkScheduleConflicts(instructorId, startDate, endDate)
        .then(setConflicts)
        .catch(console.error);
    } else {
      setConflicts([]);
    }
  }, [watchedValues]);

  const createScheduleMutation = useMutation({
    mutationFn: CourseSchedulingService.createSchedule,
    onSuccess: (schedule) => {
      toast.success('Course schedule created successfully');
      queryClient.invalidateQueries({ queryKey: ['course-schedules'] });
      form.reset();
      setConflicts([]);
      onScheduleCreated?.(schedule);
    },
    onError: (error: any) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    }
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (conflicts.length > 0) {
      toast.error('Please resolve conflicts before creating the schedule');
      return;
    }

    createScheduleMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Schedule Course Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Selection */}
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!courseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor Selection */}
            <FormField
              control={form.control}
              name="instructor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instructors?.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.display_name} ({instructor.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Selection */}
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date/Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      End Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity Selection */}
            <FormField
              control={form.control}
              name="max_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Maximum Participants
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Schedule Conflicts Detected:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm">
                        {conflict.message} ({new Date(conflict.startDate).toLocaleString()} - {new Date(conflict.endDate).toLocaleString()})
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setConflicts([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createScheduleMutation.isPending || conflicts.length > 0}
              >
                {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
