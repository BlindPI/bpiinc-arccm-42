
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Power } from 'lucide-react';
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

interface Course {
  id: string;
  name: string;
  description: string | null;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export function CourseTable() {
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Course[];
    },
  });

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
    return <div>Loading courses...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Expiration (months)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses?.map((course) => (
            <TableRow key={course.id}>
              <TableCell>{course.name}</TableCell>
              <TableCell>{course.description || '-'}</TableCell>
              <TableCell>{course.expiration_months}</TableCell>
              <TableCell>
                <span className={course.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                  {course.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
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
