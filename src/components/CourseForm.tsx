
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
import { FileText, Timer, Plus } from 'lucide-react';

export function CourseForm() {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [expirationMonths, setExpirationMonths] = React.useState('12');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by: string;
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
          
          <Button 
            type="submit" 
            className="w-full transition-all hover:shadow-md"
            disabled={createCourse.isPending}
          >
            {createCourse.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
