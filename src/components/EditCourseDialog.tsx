import React from 'react';
import { Course } from '@/types/courses';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCourseTypes } from '@/hooks/useCourseTypes';
import { useAssessmentTypes } from '@/hooks/useAssessmentTypes';

interface EditCourseDialogProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCourseDialog({ course, open, onOpenChange }: EditCourseDialogProps) {
  const [name, setName] = React.useState(course.name);
  const [description, setDescription] = React.useState(course.description || '');
  const [expirationMonths, setExpirationMonths] = React.useState(course.expiration_months.toString());
  const [courseLength, setCourseLength] = React.useState(course.length?.toString() || '');
  const [courseTypeId, setCourseTypeId] = React.useState(course.course_type_id || '');
  const [assessmentTypeId, setAssessmentTypeId] = React.useState(course.assessment_type_id || '');
  const [firstAidLevel, setFirstAidLevel] = React.useState(course.first_aid_level || 'none');
  const [cprLevel, setCprLevel] = React.useState(course.cpr_level || 'none');

  const { courseTypes } = useCourseTypes();
  const { assessmentTypes } = useAssessmentTypes();
  
  // Filter for active types only
  const activeCourseTypes = courseTypes.filter(type => type.active);
  const activeAssessmentTypes = assessmentTypes.filter(type => type.active);

  // Find the selected course type
  const selectedCourseType = courseTypes.find(type => type.id === courseTypeId);
  
  // Check if the selected course type is First Aid or CPR related
  const isFirstAidOrCprCourse = 
    selectedCourseType?.name === 'First Aid' || 
    selectedCourseType?.name === 'CPR' ||
    !courseTypeId; // If no course type is selected, show certification fields

  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Reset form when dialog opens with new course data
    if (open) {
      setName(course.name);
      setDescription(course.description || '');
      setExpirationMonths(course.expiration_months.toString());
      setCourseLength(course.length?.toString() || '');
      setCourseTypeId(course.course_type_id || '');
      setAssessmentTypeId(course.assessment_type_id || '');
      setFirstAidLevel(course.first_aid_level || 'none');
      setCprLevel(course.cpr_level || 'none');
    }
  }, [course, open]);

  const updateCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      length?: number | null;
      course_type_id?: string | null;
      assessment_type_id?: string | null;
      first_aid_level?: string | null;
      cpr_level?: string | null;
    }) => {
      const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', course.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourse.mutate({
      name,
      description,
      expiration_months: parseInt(expirationMonths),
      length: courseLength ? parseInt(courseLength) : null,
      course_type_id: courseTypeId || null,
      assessment_type_id: assessmentTypeId || null,
      first_aid_level: firstAidLevel !== 'none' ? firstAidLevel : null,
      cpr_level: cprLevel !== 'none' ? cprLevel : null,
    });
  };

  const VALID_FIRST_AID_LEVELS = ['Standard First Aid', 'Emergency First Aid', 'Advanced First Aid'];
  const VALID_CPR_LEVELS = ['CPR A w/AED', 'CPR C w/AED', 'CPR BLS w/AED', 'CPR BLS w/AED 24m'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseType">Course Type</Label>
            <Select 
              value={courseTypeId} 
              onValueChange={setCourseTypeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Course Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {activeCourseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessmentType">Assessment Type</Label>
            <Select 
              value={assessmentTypeId} 
              onValueChange={setAssessmentTypeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Assessment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {activeAssessmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expirationMonths">Expiration Period (months)</Label>
              <Input
                id="expirationMonths"
                type="number"
                min="1"
                value={expirationMonths}
                onChange={(e) => setExpirationMonths(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseLength">Course Length (hours)</Label>
              <Input
                id="courseLength"
                type="number"
                min="1"
                value={courseLength}
                onChange={(e) => setCourseLength(e.target.value)}
                placeholder="Enter hours"
              />
            </div>
          </div>

          {isFirstAidOrCprCourse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstAidLevel">First Aid Level</Label>
                <Select 
                  value={firstAidLevel} 
                  onValueChange={setFirstAidLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select First Aid Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {VALID_FIRST_AID_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cprLevel">CPR Level</Label>
                <Select 
                  value={cprLevel} 
                  onValueChange={setCprLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CPR Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {VALID_CPR_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateCourse.isPending}
            >
              {updateCourse.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
