import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { CourseSchedulingIntegration, SchedulingResult } from '@/services/availability/courseSchedulingIntegration';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const InstructorSchedulingPanel: React.FC = () => {
  const [formData, setFormData] = useState({
    courseId: '',
    instructorId: '',
    locationId: '',
    startDateTime: '',
    endDateTime: '',
    title: '',
    description: ''
  });
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null);
  
  const queryClient = useQueryClient();

  // Get courses
  const { data: courses } = useQuery({
    queryKey: ['courses-for-scheduling'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get instructors
  const { data: instructors } = useQuery({
    queryKey: ['instructors-for-scheduling'],
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
    queryKey: ['locations-for-scheduling'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Schedule course mutation
  const scheduleCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await CourseSchedulingIntegration.scheduleInstructorForCourse({
        courseId: data.courseId,
        instructorId: data.instructorId,
        locationId: data.locationId,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        title: data.title,
        description: data.description
      });
    },
    onSuccess: (result) => {
      setSchedulingResult(result);
      if (result.success) {
        toast.success('Course scheduled successfully!');
        queryClient.invalidateQueries({ queryKey: ['availability-bookings'] });
        // Reset form
        setFormData({
          courseId: '',
          instructorId: '',
          locationId: '',
          startDateTime: '',
          endDateTime: '',
          title: '',
          description: ''
        });
      } else {
        toast.error('Scheduling conflicts detected');
      }
    },
    onError: (error: any) => {
      toast.error(`Scheduling failed: ${error.message}`);
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear previous results when form changes
    if (schedulingResult) {
      setSchedulingResult(null);
    }
  };

  const handleSchedule = () => {
    if (!formData.courseId || !formData.instructorId || !formData.startDateTime || !formData.endDateTime || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    scheduleCourseMutation.mutate(formData);
  };

  const isFormValid = formData.courseId && formData.instructorId && formData.startDateTime && 
                     formData.endDateTime && formData.title;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Course Scheduling
        </CardTitle>
        <CardDescription>
          Schedule instructors for courses with automatic conflict detection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Course Selection */}
        <div className="space-y-2">
          <Label htmlFor="course-select">Course *</Label>
          <select
            id="course-select"
            value={formData.courseId}
            onChange={(e) => handleInputChange('courseId', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a course...</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Instructor Selection */}
        <div className="space-y-2">
          <Label htmlFor="instructor-select">Instructor *</Label>
          <select
            id="instructor-select"
            value={formData.instructorId}
            onChange={(e) => handleInputChange('instructorId', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select an instructor...</option>
            {instructors?.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.display_name || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        {/* Location Selection */}
        <div className="space-y-2">
          <Label htmlFor="location-select">Location</Label>
          <select
            id="location-select"
            value={formData.locationId}
            onChange={(e) => handleInputChange('locationId', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a location...</option>
            {locations?.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} {location.address && `- ${location.address}`}
              </option>
            ))}
          </select>
        </div>

        {/* Date/Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-datetime">Start Date & Time *</Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => handleInputChange('startDateTime', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-datetime">End Date & Time *</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => handleInputChange('endDateTime', e.target.value)}
            />
          </div>
        </div>

        {/* Course Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            placeholder="Enter course session title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional course description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Schedule Button */}
        <Button 
          onClick={handleSchedule}
          disabled={!isFormValid || scheduleCourseMutation.isPending}
          className="w-full"
        >
          {scheduleCourseMutation.isPending ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Course
            </>
          )}
        </Button>

        {/* Results */}
        {schedulingResult && (
          <div className="space-y-4">
            <Separator />
            
            {/* Status */}
            <Alert className={schedulingResult.success ? 'border-success' : 'border-destructive'}>
              <div className="flex items-center gap-2">
                {schedulingResult.success ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription>
                  {schedulingResult.message}
                </AlertDescription>
              </div>
            </Alert>

            {/* Conflict Details */}
            {!schedulingResult.success && schedulingResult.conflicts?.hasConflicts && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Scheduling Conflicts:
                </h4>
                {schedulingResult.conflicts.conflicts.map((conflict, index) => (
                  <Card key={index} className="border-l-4 border-l-destructive">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">
                          {conflict.severity} priority
                        </Badge>
                        <Badge variant="outline">
                          {conflict.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Conflicts with:</strong> {conflict.conflictWith}
                      </p>
                      <p className="text-sm">
                        {conflict.reason}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {/* Suggested Times */}
                {schedulingResult.conflicts.suggestedTimes && schedulingResult.conflicts.suggestedTimes.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Suggested Alternative Times:</h5>
                    {schedulingResult.conflicts.suggestedTimes.map((slot, index) => (
                      <Card key={index} className="border-l-4 border-l-success">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleTimeString()}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleInputChange('startDateTime', slot.start.slice(0, 16));
                                handleInputChange('endDateTime', slot.end.slice(0, 16));
                              }}
                            >
                              Use This Time
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};