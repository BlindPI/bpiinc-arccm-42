
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { ActivityForm } from '@/components/crm/ActivityForm';
import { toast } from 'sonner';
import type { Activity } from '@/types/crm';

export function ActivitiesTable() {
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: () => CRMService.getActivities()
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (activityId: string) => CRMService.deleteActivity(activityId),
    onSuccess: () => {
      toast.success('Activity deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      toast.error('Failed to delete activity: ' + error.message);
    }
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ activityId, completed }: { activityId: string; completed: boolean }) =>
      CRMService.updateActivity(activityId, { completed }),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      toast.error('Failed to update activity: ' + error.message);
    }
  });

  const handleCreateActivity = () => {
    setSelectedActivity(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (confirm(`Are you sure you want to delete this ${activity.activity_type}?`)) {
      deleteActivityMutation.mutate(activity.id);
    }
  };

  const handleToggleComplete = (activity: Activity) => {
    toggleCompleteMutation.mutate({
      activityId: activity.id,
      completed: !activity.completed
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'note': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      case 'note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (completed: boolean, dueDate?: string) => {
    if (completed) return 'bg-green-100 text-green-800';
    
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      if (due < now) return 'bg-red-100 text-red-800';
      if (due <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) return 'bg-yellow-100 text-yellow-800';
    }
    
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (completed: boolean, dueDate?: string) => {
    if (completed) return 'Completed';
    
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      if (due < now) return 'Overdue';
      if (due <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) return 'Due Soon';
    }
    
    return 'Pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
                Track tasks, calls, meetings, and other customer interactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
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
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.activity_type)}
                        <div>
                          <h3 className="font-medium">{activity.subject}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.activity_date)}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-gray-400 truncate max-w-md">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getActivityTypeColor(activity.activity_type)}>
                        {activity.activity_type}
                      </Badge>
                      
                      <Badge className={getStatusColor(activity.completed, activity.due_date)}>
                        {getStatusText(activity.completed, activity.due_date)}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        {!activity.completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleComplete(activity)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewActivity(activity)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!activity.completed && (
                              <DropdownMenuItem onClick={() => handleToggleComplete(activity)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {dialogOpen && (
        <ActivityForm
          activity={selectedActivity}
          mode={dialogMode}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
            setDialogOpen(false);
          }}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
