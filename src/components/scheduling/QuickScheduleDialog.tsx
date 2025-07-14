import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Book, Plus, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InstructorAvailability } from '@/hooks/useCalendarScheduling';
import { TrainingSessionBuilder, TrainingSession } from '@/components/course-sequence/TrainingSessionBuilder';

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

  const [trainingSession, setTrainingSession] = useState<TrainingSession>({
    title: '',
    description: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    courseSequence: { items: [], totalDuration: 0 }
  });

  // Course creation state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    expiration_months: 12,
    first_aid_level: '',
    cpr_level: ''
  });

  const queryClient = useQueryClient();

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
      setTrainingSession(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSchedule = async () => {
    // Use training session for multi-course, otherwise use simple form
    if (formData.bookingType === 'course_instruction' && trainingSession.courseSequence.items.length > 0) {
      if (!formData.instructorId || !trainingSession.title || !trainingSession.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      try {
        // Calculate end time from course sequence
        const [hours, minutes] = trainingSession.startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + trainingSession.courseSequence.totalDuration;
        
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

        const startDateTime = new Date(`${trainingSession.date}T${trainingSession.startTime}`);
        const endDateTime = new Date(`${trainingSession.date}T${endTime}`);

        await onSchedule({
          instructorId: formData.instructorId,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          title: trainingSession.title,
          description: trainingSession.description,
          bookingType: formData.bookingType,
          courseSequence: trainingSession.courseSequence
        });
      } catch (error: any) {
        toast.error(`Failed to schedule: ${error.message}`);
        return;
      }
    } else {
      // Original simple scheduling
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
      } catch (error: any) {
        toast.error(`Failed to schedule: ${error.message}`);
        return;
      }
    }

    // Reset forms and close dialog
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
    setTrainingSession({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      courseSequence: { items: [], totalDuration: 0 }
    });
    onOpenChange(false);
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name) {
      toast.error('Course name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          name: newCourse.name,
          description: newCourse.description,
          expiration_months: newCourse.expiration_months,
          status: 'ACTIVE',
          first_aid_level: newCourse.first_aid_level || null,
          cpr_level: newCourse.cpr_level || null,
          created_by: null
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh courses query
      queryClient.invalidateQueries({ queryKey: ['courses-for-quick-schedule'] });
      
      // Select the newly created course
      setFormData(prev => ({ ...prev, courseId: data.id }));
      
      // Reset course form and close
      setNewCourse({
        name: '',
        description: '',
        expiration_months: 12,
        first_aid_level: '',
        cpr_level: ''
      });
      setShowCreateCourse(false);
      
      toast.success('Course created successfully');
    } catch (error: any) {
      toast.error(`Failed to create course: ${error.message}`);
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Schedule
          </DialogTitle>
          <DialogDescription>
            Quickly schedule a course or training session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
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

          {/* Multi-Course Training Session (if course instruction) */}
          {formData.bookingType === 'course_instruction' && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <Label className="text-base font-medium">Multi-Course Training Session</Label>
              </div>
              <TrainingSessionBuilder
                session={trainingSession}
                onSessionChange={setTrainingSession}
                instructorAvailability={instructorAvailability}
                locationId={locationId}
                teamId={teamId}
              />
              <Separator />
            </div>
          )}

          {/* Single Course Selection (for non-course instruction or fallback) */}
          {formData.bookingType === 'course_instruction' && trainingSession.courseSequence.items.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Single Course (Legacy)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCourse(!showCreateCourse)}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Course
                  {showCreateCourse ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>

              {showCreateCourse && (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="course-name" className="text-xs">Course Name *</Label>
                      <Input
                        id="course-name"
                        placeholder="Enter course name"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="expiration" className="text-xs">Expiration (months)</Label>
                      <Input
                        id="expiration"
                        type="number"
                        min="1"
                        max="120"
                        value={newCourse.expiration_months}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, expiration_months: parseInt(e.target.value) || 12 }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="course-desc" className="text-xs">Description</Label>
                    <Textarea
                      id="course-desc"
                      placeholder="Optional course description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="first-aid" className="text-xs">First Aid Level</Label>
                      <Input
                        id="first-aid"
                        placeholder="e.g., Basic, Advanced"
                        value={newCourse.first_aid_level}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, first_aid_level: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cpr-level" className="text-xs">CPR Level</Label>
                      <Input
                        id="cpr-level"
                        placeholder="e.g., BLS, CPR"
                        value={newCourse.cpr_level}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, cpr_level: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCourse}
                      className="h-7"
                    >
                      Create Course
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateCourse(false)}
                      className="h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

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

          {/* Title - only show if not using multi-course session */}
          {!(formData.bookingType === 'course_instruction' && trainingSession.courseSequence.items.length > 0) && (
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter session title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
          )}

          {/* Description - only show if not using multi-course session */}
          {!(formData.bookingType === 'course_instruction' && trainingSession.courseSequence.items.length > 0) && (
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
          )}

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