
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableOptimized } from '@/components/ui/DataTableOptimized';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService, Activity } from '@/services/crm/crmService';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { ActivityForm } from './ActivityForm';

const typeColors = {
  call: 'bg-blue-100 text-blue-800',
  email: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800',
  task: 'bg-yellow-100 text-yellow-800',
  note: 'bg-gray-100 text-gray-800'
};

export const ActivitiesTable: React.FC = () => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    completed: undefined as boolean | undefined
  });

  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', filters],
    queryFn: () => CRMService.getActivities(filters)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      CRMService.updateActivity(id, data),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => {
      toast.error('Failed to update activity');
    }
  });

  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge className={typeColors[type as keyof typeof typeColors]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div>
            <div className="font-medium">{activity.subject}</div>
            {activity.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {activity.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.getValue('due_date') as string;
        if (!dueDate) return <span className="text-muted-foreground">-</span>;
        
        const isOverdue = new Date(dueDate) < new Date() && !row.original.completed;
        return (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar className="h-3 w-3" />
            {formatDateTime(dueDate)}
          </div>
        );
      },
    },
    {
      accessorKey: 'completed',
      header: 'Status',
      cell: ({ row }) => {
        const completed = row.getValue('completed') as boolean;
        return (
          <Badge variant={completed ? 'default' : 'secondary'}>
            {completed ? 'Completed' : 'Pending'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDateTime(row.getValue('created_at'))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedActivity(activity);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateMutation.mutate({
                  id: activity.id,
                  data: { completed: !activity.completed }
                })}
              >
                {activity.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleActivitySaved = () => {
    setIsFormOpen(false);
    setSelectedActivity(null);
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search activities..."
          className="max-w-sm"
        />
        <Select 
          value={filters.type} 
          onValueChange={(value) => setFilters({...filters, type: value})}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.completed?.toString() || ''} 
          onValueChange={(value) => setFilters({
            ...filters, 
            completed: value === '' ? undefined : value === 'true'
          })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
            <SelectItem value="true">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedActivity(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedActivity ? 'Edit Activity' : 'Create New Activity'}
              </DialogTitle>
            </DialogHeader>
            <ActivityForm 
              activity={selectedActivity}
              onSave={handleActivitySaved}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTableOptimized
        columns={columns}
        data={activities || []}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No activities found. Create your first activity to get started."
      />
    </div>
  );
};
