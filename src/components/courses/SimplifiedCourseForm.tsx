
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Timer, Plus, Award, ActivitySquare } from 'lucide-react';
import { useCourseTypes } from '@/hooks/useCourseTypes';

// Define valid levels - these should be consistent across the application
export const VALID_FIRST_AID_LEVELS = ['Standard First Aid', 'Emergency First Aid', 'Standard First Aid: Recertification', 'Emergency First Aid: Recertification', 'Emergency First Aid: Instruction', 'Standard First Aid: Instruction'];
export const VALID_CPR_LEVELS = ['CPR A w/AED', 'CPR C w/AED', 'CPR BLS w/AED', 'CPR BLS w/AED 24m'];

export function SimplifiedCourseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { courseTypes } = useCourseTypes();
  
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    expirationMonths: '24',
    courseLength: '',
    courseTypeId: '',
    firstAidLevel: 'none',
    cprLevel: 'none',
  });

  // Helper function to update form state
  const updateField = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const createCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by: string;
      course_type_id?: string;
      length?: number;
      first_aid_level?: string;
      cpr_level?: string;
    }) => {
      const { error } = await supabase.from('courses').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      
      // Reset form
      setFormState({
        name: '',
        description: '',
        expirationMonths: '24',
        courseLength: '',
        courseTypeId: '',
        firstAidLevel: 'none',
        cprLevel: 'none',
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create courses');
      return;
    }

    createCourse.mutate({
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      course_type_id: formState.courseTypeId || undefined,
      length: formState.courseLength ? parseInt(formState.courseLength) : undefined,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : undefined,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : undefined,
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          New Course
        </CardTitle>
        <CardDescription>
          Create a new course with clear certification levels for better matching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Details */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Course Name
            </Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              placeholder="Enter course name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter course description (optional)"
              className="min-h-[80px]"
            />
          </div>
          
          {/* Course Type */}
          <div className="space-y-2">
            <Label htmlFor="courseType">Course Type</Label>
            <Select 
              value={formState.courseTypeId} 
              onValueChange={(value) => updateField('courseTypeId', value)}
            >
              <SelectTrigger id="courseType">
                <SelectValue placeholder="Select Course Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {courseTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expirationMonths" className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-500" />
                Expiration Period (months)
              </Label>
              <Input
                id="expirationMonths"
                type="number"
                min="1"
                value={formState.expirationMonths}
                onChange={(e) => updateField('expirationMonths', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseLength" className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-500" />
                Course Length (hours)
              </Label>
              <Input
                id="courseLength"
                type="number"
                min="1"
                value={formState.courseLength}
                onChange={(e) => updateField('courseLength', e.target.value)}
                placeholder="Enter hours"
              />
            </div>
          </div>

          {/* Certification Levels */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Certification Levels</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstAidLevel" className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  First Aid Level
                </Label>
                <Select 
                  value={formState.firstAidLevel} 
                  onValueChange={(value) => updateField('firstAidLevel', value)}
                >
                  <SelectTrigger id="firstAidLevel">
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
                <Label htmlFor="cprLevel" className="flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4 text-orange-500" />
                  CPR Level
                </Label>
                <Select 
                  value={formState.cprLevel} 
                  onValueChange={(value) => updateField('cprLevel', value)}
                >
                  <SelectTrigger id="cprLevel">
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
          </div>
          
          <Button 
            type="submit" 
            className="w-full transition-all hover:shadow-md mt-4"
            disabled={createCourse.isPending}
          >
            {createCourse.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
