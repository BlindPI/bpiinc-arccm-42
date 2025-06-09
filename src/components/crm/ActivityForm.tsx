
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Activity, ActivityType } from '@/types/supabase-schema';

interface ActivityFormProps {
  activity?: Activity | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ActivityForm({ activity, onSave, onCancel }: ActivityFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    activity_type: 'task' as ActivityType,
    subject: '',
    description: '',
    due_date: '',
    completed: false
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_type: activity.activity_type,
        subject: activity.subject,
        description: activity.description || '',
        due_date: activity.due_date ? activity.due_date.split('T')[0] : '',
        completed: activity.completed
      });
    }
  }, [activity]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => CRMService.createActivity(data),
    onSuccess: () => {
      toast.success('Activity created successfully');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onSave();
    },
    onError: (error) => {
      toast.error('Failed to create activity: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => CRMService.updateActivity(activity!.id, data),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onSave();
    },
    onError: (error) => {
      toast.error('Failed to update activity: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (activity) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Activity Type</Label>
          <Select 
            value={formData.activity_type} 
            onValueChange={(value) => handleChange('activity_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleChange('due_date', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="Enter activity subject"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter activity description..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="completed"
          checked={formData.completed}
          onCheckedChange={(checked) => handleChange('completed', checked)}
        />
        <Label htmlFor="completed">Mark as completed</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
        </Button>
      </div>
    </form>
  );
}
