import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Phone,
  Mail,
  Users,
  CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { ActivityForm } from '@/components/crm/forms/ActivityForm';
import { toast } from 'sonner';
import type { Activity } from '@/types/crm';

export function ActivitiesTable() {
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: () => CRMService.getActivities()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => CRMService.createActivity(data),
    onSuccess: () => {
      toast.success('Activity created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      setDialogOpen(false);
      setSelectedActivity(undefined);
    },
    onError: (error) => {
      toast.error('Failed to create activity: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      CRMService.updateActivity(id, data),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      setDialogOpen(false);
      setSelectedActivity(undefined);
    },
    onError: (error) => {
      toast.error('Failed to update activity: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (activityId: string) => CRMService.deleteActivity(activityId),
    onSuccess: () => {
      toast.success('Activity deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      toast.error('Failed to delete activity: ' + error.message);
    }
  });

  const handleCreateActivity = () => {
    setSelectedActivity(undefined);
    setDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (confirm(`Are you sure you want to delete the activity "${activity.subject}"?`)) {
      deleteMutation.mutate(activity.id);
    }
  };

  const handleActivitySaved = (data: any) => {
    if (selectedActivity) {
      updateMutation.mutate({
        id: selectedActivity.id,
        data: { ...data, updated_at: new Date().toISOString() }
      });
    } else {
      createMutation.mutate({ ...data, created_at: new Date().toISOString() });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Activities refreshed');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'low': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Management</CardTitle>
              <CardDescription>
                Track all customer interactions and follow-up tasks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCreateActivity}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities found. Create your first activity to get started.</p>
                <Button onClick={handleCreateActivity} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Activity
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{activity.subject}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {activity.activity_type.replace('_', ' ')} • {new Date(activity.activity_date).toLocaleDateString()}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-400 line-clamp-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(activity.status)}>
                        {(activity.status || 'pending').replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                        {(activity.priority || 'medium')} priority
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteActivity(activity)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedActivity ? 'Edit Activity' : 'Create New Activity'}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm 
            activity={selectedActivity}
            onSave={handleActivitySaved}
            onCancel={() => setDialogOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
