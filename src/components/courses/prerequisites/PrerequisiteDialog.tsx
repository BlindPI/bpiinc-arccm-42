
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PrerequisiteDialog({ open, onOpenChange, onSubmit, initialData, courses }) {
  const [courseId, setCourseId] = React.useState('');
  const [prerequisiteId, setPrerequisiteId] = React.useState('');
  const [isRequired, setIsRequired] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setCourseId(initialData?.course_id || '');
      setPrerequisiteId(initialData?.prerequisite_course_id || '');
      setIsRequired(initialData?.is_required ?? true);
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  // Filter prerequisite course options to prevent selecting the same course
  const filteredPrerequisites = courseId 
    ? courses.filter(course => course.id !== courseId)
    : courses;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!courseId) {
      toast.error('Please select a course');
      return;
    }
    
    if (!prerequisiteId) {
      toast.error('Please select a prerequisite course');
      return;
    }
    
    if (courseId === prerequisiteId) {
      toast.error('A course cannot be a prerequisite for itself');
      return;
    }
    
    setIsSubmitting(true);
    
    const data = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      course_id: courseId,
      prerequisite_course_id: prerequisiteId,
      is_required: isRequired
    };
    
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Prerequisite' : 'Add Course Prerequisite'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="courseId">Course</Label>
            <Select
              value={courseId}
              onValueChange={setCourseId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="courseId">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.length > 0 ? (
                  courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="prerequisiteId">Prerequisite Course</Label>
            <Select
              value={prerequisiteId}
              onValueChange={setPrerequisiteId}
              disabled={isSubmitting || !courseId}
            >
              <SelectTrigger id="prerequisiteId">
                <SelectValue placeholder={courseId ? "Select a prerequisite course" : "First select a course"} />
              </SelectTrigger>
              <SelectContent>
                {filteredPrerequisites.length > 0 ? (
                  filteredPrerequisites.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-prereqs" disabled>No available prerequisites</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isRequired"
              checked={isRequired}
              onCheckedChange={setIsRequired}
              disabled={isSubmitting}
            />
            <Label htmlFor="isRequired">Required Prerequisite</Label>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !courseId || !prerequisiteId}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
