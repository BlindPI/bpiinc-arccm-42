
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Timer, Plus, Award, ActivitySquare, Info } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

// Define valid levels
const VALID_FIRST_AID_LEVELS = ['Standard First Aid', 'Emergency First Aid', ''];
const VALID_CPR_LEVELS = ['CPR A', 'CPR A w/AED', 'CPR C', 'CPR C w/AED', 'CPR BLS', 'CPR BLS w/AED', ''];

export function CourseForm() {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [expirationMonths, setExpirationMonths] = React.useState('12');
  const [courseLength, setCourseLength] = React.useState('');
  const [firstAidLevel, setFirstAidLevel] = React.useState('');
  const [cprLevel, setCprLevel] = React.useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by: string;
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
      setName('');
      setDescription('');
      setExpirationMonths('12');
      setCourseLength('');
      setFirstAidLevel('');
      setCprLevel('');
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
      name,
      description,
      expiration_months: parseInt(expirationMonths),
      created_by: user.id,
      length: courseLength ? parseInt(courseLength) : undefined,
      first_aid_level: firstAidLevel || null,
      cpr_level: cprLevel || null,
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          New Course
        </CardTitle>
        <CardDescription className="text-gray-600">
          Create a new course for certificate requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Course Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter course name"
              className="transition-colors focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description (optional)"
              className="min-h-[100px] transition-colors focus:border-primary"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expirationMonths" className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-500" />
                Expiration Period
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="expirationMonths"
                  type="number"
                  min="1"
                  value={expirationMonths}
                  onChange={(e) => setExpirationMonths(e.target.value)}
                  required
                  className="transition-colors focus:border-primary"
                />
                <span className="text-sm text-gray-500">months</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="courseLength" className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  Course Length
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Course length is used for automatic course matching in batch uploads
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="courseLength"
                  type="number"
                  min="1"
                  value={courseLength}
                  onChange={(e) => setCourseLength(e.target.value)}
                  className="transition-colors focus:border-primary"
                  placeholder="Enter hours"
                />
                <span className="text-sm text-gray-500">hours</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Certification Details</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        These fields are used for automatic course matching when processing roster uploads.
                        Setting them correctly helps connect students to the right courses.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Specify certification levels for automatic course matching
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="firstAidLevel" className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  First Aid Level
                </Label>
                <Select 
                  value={firstAidLevel} 
                  onValueChange={setFirstAidLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select First Aid Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {VALID_FIRST_AID_LEVELS.filter(Boolean).map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cprLevel" className="flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4 text-gray-500" />
                  CPR Level
                </Label>
                <Select 
                  value={cprLevel} 
                  onValueChange={setCprLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CPR Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {VALID_CPR_LEVELS.filter(Boolean).map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full transition-all hover:shadow-md"
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
