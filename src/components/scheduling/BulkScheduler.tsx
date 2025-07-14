import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useCalendarScheduling } from '@/hooks/useCalendarScheduling';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BulkSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkSchedulingData {
  instructorIds: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  title: string;
  bookingType: string;
  courseId?: string;
  daysOfWeek: number[];
  description?: string;
}

export function BulkScheduler({ open, onOpenChange }: BulkSchedulerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BulkSchedulingData>({
    instructorIds: [],
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    title: '',
    bookingType: 'training_session',
    daysOfWeek: [],
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Get available instructors
  const { data: instructors } = useQuery({
    queryKey: ['bulk-scheduler-instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, display_name, role,
          user_availability (day_of_week, start_time, end_time)
        `)
        .in('role', ['IC', 'IP', 'IT']);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Get available courses
  const { data: courses } = useQuery({
    queryKey: ['bulk-scheduler-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description')
        .eq('active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const bulkCreateBookings = useMutation({
    mutationFn: async (data: BulkSchedulingData) => {
      const bookings = [];
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      // Generate bookings for selected date range and days of week
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (data.daysOfWeek.includes(date.getDay())) {
          for (const instructorId of data.instructorIds) {
            bookings.push({
              user_id: instructorId,
              booking_date: date.toISOString().split('T')[0],
              start_time: data.startTime,
              end_time: data.endTime,
              title: data.title,
              booking_type: data.bookingType,
              course_id: data.courseId || null,
              description: data.description,
              status: 'scheduled'
            });
          }
        }
      }

      // Create bulk operation record
      const { data: bulkOp, error: bulkError } = await supabase
        .from('bulk_operation_queue')
        .insert({
          operation_id: `bulk-schedule-${Date.now()}`,
          operation_type: 'bulk_scheduling',
          target_users: data.instructorIds,
          total_count: bookings.length,
          scheduled_data: { bookings: bookings as any, formData: data as any }
        })
        .select()
        .single();

      if (bulkError) throw bulkError;

      // Insert bookings in batches
      const batchSize = 50;
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < bookings.length; i += batchSize) {
        const batch = bookings.slice(i, i + batchSize);
        
        try {
          const { data: batchResult, error: batchError } = await supabase
            .from('availability_bookings')
            .insert(batch)
            .select();

          if (batchError) {
            failedCount += batch.length;
            errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
          } else {
            successCount += batchResult?.length || 0;
          }
        } catch (error: any) {
          failedCount += batch.length;
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        }

        // Update progress
        await supabase
          .from('bulk_operation_queue')
          .update({
            processed_count: successCount + failedCount,
            status: i + batchSize >= bookings.length ? 'completed' : 'processing'
          })
          .eq('id', bulkOp.id);
      }

      return { successCount, failedCount, errors, total: bookings.length };
    },
    onSuccess: (result) => {
      setResults({ 
        success: result.successCount, 
        failed: result.failedCount, 
        errors: result.errors 
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      
      if (result.successCount > 0) {
        toast.success(`Successfully scheduled ${result.successCount} sessions`);
      }
      if (result.failedCount > 0) {
        toast.error(`Failed to schedule ${result.failedCount} sessions`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk scheduling failed: ${error.message}`);
      setResults({ success: 0, failed: 0, errors: [error.message] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.instructorIds.length === 0) {
      toast.error('Please select at least one instructor');
      return;
    }
    
    if (formData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day of the week');
      return;
    }

    setIsProcessing(true);
    setResults(null);
    
    try {
      await bulkCreateBookings.mutateAsync(formData);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstructorToggle = (instructorId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      instructorIds: checked 
        ? [...prev.instructorIds, instructorId]
        : prev.instructorIds.filter(id => id !== instructorId)
    }));
  };

  const handleDayToggle = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: checked 
        ? [...prev.daysOfWeek, day]
        : prev.daysOfWeek.filter(d => d !== day)
    }));
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bulk Schedule Sessions
          </DialogTitle>
        </DialogHeader>

        {results ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Successful</div>
                  <div className="text-green-700">{results.success} sessions created</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Failed</div>
                  <div className="text-red-700">{results.failed} sessions failed</div>
                </div>
              </div>
            </div>
            
            {results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-900">Errors:</h4>
                <div className="space-y-1">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 p-2 bg-red-50 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={() => setResults(null)} variant="outline">
                Schedule More
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Training Session"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingType">Session Type</Label>
                <Select 
                  value={formData.bookingType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bookingType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training_session">Training Session</SelectItem>
                    <SelectItem value="course_instruction">Course Instruction</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course Selection */}
            {formData.bookingType === 'course_instruction' && (
              <div className="space-y-2">
                <Label htmlFor="courseId">Course</Label>
                <Select
                  value={formData.courseId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {dayNames.map((day, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}`}
                      checked={formData.daysOfWeek.includes(index)}
                      onCheckedChange={(checked) => handleDayToggle(index, checked as boolean)}
                    />
                    <Label htmlFor={`day-${index}`} className="text-sm">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Selection */}
            <div className="space-y-2">
              <Label>Select Instructors ({formData.instructorIds.length} selected)</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2">
                {instructors?.map(instructor => (
                  <div key={instructor.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`instructor-${instructor.id}`}
                        checked={formData.instructorIds.includes(instructor.id)}
                        onCheckedChange={(checked) => handleInstructorToggle(instructor.id, checked as boolean)}
                      />
                      <Label htmlFor={`instructor-${instructor.id}`} className="flex items-center gap-2">
                        {instructor.display_name}
                        <Badge variant="outline" className="text-xs">
                          {instructor.role}
                        </Badge>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about the sessions"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Sessions...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Sessions
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}