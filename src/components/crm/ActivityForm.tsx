
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CRMService, Activity } from '@/services/crm/crmService';
import { toast } from 'sonner';

const activityFormSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  completed: z.boolean(),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  activity?: Activity | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({ 
  activity, 
  onSave, 
  onCancel 
}) => {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: activity?.type || 'task',
      subject: activity?.subject || '',
      description: activity?.description || '',
      due_date: activity?.due_date || '',
      completed: activity?.completed || false,
    },
  });

  const createMutation = useMutation({
    mutationFn: CRMService.createActivity,
    onSuccess: () => {
      toast.success('Activity created successfully');
      onSave();
    },
    onError: () => {
      toast.error('Failed to create activity');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      CRMService.updateActivity(id, data),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      onSave();
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    if (activity) {
      updateMutation.mutate({ id: activity.id, data });
    } else {
      createMutation.mutate(data as Omit<Activity, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Brief description of the activity" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder="Detailed notes about the activity" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Mark as completed
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
