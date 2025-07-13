import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Book } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InstructorAvailability } from '@/hooks/useCalendarScheduling';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  instructorAvailability?: InstructorAvailability[];
  onSchedule: (data: any) => Promise<void>;
  locationId?: string;
  teamId?: string;
}

export const QuickScheduleDialog: React.FC<QuickScheduleDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  instructorAvailability,
  onSchedule,
  locationId,
  teamId
}) => {
  const [formData, setFormData] = useState({
    instructorId: '',
    courseId: '',
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    bookingType: 'course_instruction'
  });

  // Get courses
  const { data: courses } = useQuery({
    queryKey: ['courses-for-quick-schedule'],
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

  // Update date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSchedule = async () => {
    if (!formData.instructorId || !formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      await onSchedule({
        instructorId: formData.instructorId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        title: formData.title,
        description: formData.description,
        bookingType: formData.bookingType,
        courseId: formData.courseId || undefined
      });

      // Reset form and close dialog
      setFormData({
        instructorId: '',
        courseId: '',
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        date: format(new Date(), 'yyyy-MM-dd'),
        bookingType: 'course_instruction'
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to schedule: ${error.message}`);
    }
  };

  const getAvailableInstructors = () => {
    if (!instructorAvailability) return [];
    
    // Get day of week for selected date
    const selectedDay = new Date(formData.date).getDay();
    
    return instructorAvailability.filter(instructor => {
      // Check if instructor has availability for this day
      return instructor.availability.some(avail => avail.dayOfWeek === selectedDay);
    });
  };

  const availableInstructors = getAvailableInstructors();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Schedule
          </DialogTitle>
          <DialogDescription>
            Quickly schedule a course or training session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time *</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Instructor Selection */}
          <div className="space-y-2">
            <Label>Instructor *</Label>
            <Select value={formData.instructorId} onValueChange={(value) => handleInputChange('instructorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor..." />
              </SelectTrigger>
              <SelectContent>
                {availableInstructors.map((instructor) => (
                  <SelectItem key={instructor.instructorId} value={instructor.instructorId}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {instructor.instructorName} ({instructor.role})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Booking Type */}
          <div className="space-y-2">
            <Label>Type</Label>
          <Select value={formData.bookingType} onValueChange={(value) => handleInputChange('bookingType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course_instruction">Course Instruction</SelectItem>
              <SelectItem value="training_session">Training Session</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
          </div>

          {/* Course Selection (if course instruction) */}
          {formData.bookingType === 'course_instruction' && (
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        {course.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter session title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};