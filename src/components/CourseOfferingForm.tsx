import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, MapPin, Users, Plus } from 'lucide-react';
import type { Course, Location } from '@/types/courses';

export function CourseOfferingForm() {
  const [selectedCourse, setSelectedCourse] = React.useState<string>('');
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [maxParticipants, setMaxParticipants] = React.useState('20');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });

  const createCourseOffering = useMutation({
    mutationFn: async (data: {
      course_id: string;
      location_id: string;
      start_date: string;
      end_date: string;
      max_participants: number;
      instructor_id: string;
    }) => {
      const { error } = await supabase.from('course_offerings').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_offerings'] });
      toast.success('Course offering created successfully');
      setSelectedCourse('');
      setSelectedLocation('');
      setStartDate('');
      setEndDate('');
      setMaxParticipants('20');
    },
    onError: (error) => {
      console.error('Error creating course offering:', error);
      toast.error('Failed to create course offering');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create course offerings');
      return;
    }

    createCourseOffering.mutate({
      course_id: selectedCourse,
      location_id: selectedLocation,
      start_date: startDate,
      end_date: endDate,
      max_participants: parseInt(maxParticipants),
      instructor_id: user.id,
    });
  };

  return (
    <Card className="shadow-md max-w-3xl mx-auto">
      <CardHeader className="border-b bg-muted/10">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          New Course Offering
        </CardTitle>
        <CardDescription className="text-gray-600">
          Schedule a new course offering at a location
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
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

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              Location (Required)
            </Label>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="transition-colors focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              Maximum Participants
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              required
              className="transition-colors focus:border-primary"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full transition-all hover:shadow-md"
            disabled={createCourseOffering.isPending}
          >
            {createCourseOffering.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Course Offering
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
