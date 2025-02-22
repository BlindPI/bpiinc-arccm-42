
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Power, Calendar, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useCourseData } from '@/hooks/useCourseData';
import { Badge } from '@/components/ui/badge';

export function CourseTable() {
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useCourseData();

  const toggleStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'ACTIVE' | 'INACTIVE' }) => {
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses?.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell>
                <HoverCard>
                  <HoverCardTrigger>
                    <span className="cursor-help underline-offset-4 hover:underline">
                      {course.description ? 
                        (course.description.length > 50 ? 
                          course.description.substring(0, 47) + '...' : 
                          course.description) : 
                        '-'}
                    </span>
                  </HoverCardTrigger>
                  {course.description && (
                    <HoverCardContent>
                      <p className="text-sm">{course.description}</p>
                    </HoverCardContent>
                  )}
                </HoverCard>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{course.expiration_months} {course.expiration_months === 1 ? 'month' : 'months'}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant={course.status === 'ACTIVE' ? 'success' : 'secondary'}
                  className={course.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}
                >
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus.mutate({
                      id: course.id,
                      newStatus: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                    })}
                  >
                    <Power className={`h-4 w-4 ${course.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this course? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCourse.mutate(course.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

