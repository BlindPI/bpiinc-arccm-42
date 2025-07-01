
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, Activity, TaskMetrics } from '@/types/api';
import { TaskManagementService } from '@/services/crm/taskManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, Search } from 'lucide-react';

interface TaskManagerProps {
  userId?: string;
  leadId?: string;
  contactId?: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  userId, 
  leadId, 
  contactId 
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', { userId, leadId, contactId, statusFilter }],
    queryFn: () => TaskManagementService.getTasks({
      userId,
      leadId,
      contactId,
      status: statusFilter === 'all' ? undefined : statusFilter
    })
  });

  // Fetch task metrics
  const { data: metrics } = useQuery({
    queryKey: ['task-metrics'],
    queryFn: () => TaskManagementService.getTaskMetrics()
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => 
      TaskManagementService.createTask(taskData),
    onSuccess: () => {
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
      setIsCreating(false);
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      TaskManagementService.updateTask(taskId, updates),
    onSuccess: () => {
      toast.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
      setSelectedTask(null);
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => TaskManagementService.completeTask(taskId),
    onSuccess: () => {
      toast.success('Task completed successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
    },
    onError: () => {
      toast.error('Failed to complete task');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => TaskManagementService.deleteTask(taskId),
    onSuccess: () => {
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
    },
    onError: () => {
      toast.error('Failed to delete task');
    }
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.task_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.task_description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Task Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold">{metrics.totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{metrics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Overdue</p>
                  <p className="text-2xl font-bold">{metrics.overdueTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold">{Math.round(metrics.completionRate)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Task Management</CardTitle>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{task.task_title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.task_description && (
                        <p className="text-sm text-gray-600 mb-2">{task.task_description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        {task.estimated_duration && (
                          <span>Duration: {task.estimated_duration}min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeTaskMutation.mutate(task.id)}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      {isCreating && (
        <CreateTaskModal
          leadId={leadId}
          contactId={contactId}
          userId={userId}
          onSubmit={(taskData) => createTaskMutation.mutate(taskData)}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onSubmit={(updates) => updateTaskMutation.mutate({ 
            taskId: selectedTask.id, 
            updates 
          })}
          onCancel={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal: React.FC<{
  leadId?: string;
  contactId?: string;
  userId?: string;
  onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}> = ({ leadId, contactId, userId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    task_title: '',
    task_description: '',
    task_type: 'task',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    due_date: '',
    estimated_duration: 30,
    user_id: userId || '',
    lead_id: leadId || '',
    contact_id: contactId || '',
    activity_type: 'task',
    activity_title: '',
    activity_description: '',
    duration: 30,
    next_steps: '',
    activity_date: '',
    assigned_to: userId || '',
    tags: [] as string[],
    notes: '',
    attachments: [] as any[],
    is_recurring: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task_title">Title</Label>
              <Input
                id="task_title"
                value={formData.task_title}
                onChange={(e) => setFormData({...formData, task_title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="task_description">Description</Label>
              <Textarea
                id="task_description"
                value={formData.task_description}
                onChange={(e) => setFormData({...formData, task_description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: Task['priority']) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
              <Input
                id="estimated_duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">Create Task</Button>
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Edit Task Modal Component
const EditTaskModal: React.FC<{
  task: Task;
  onSubmit: (updates: Partial<Task>) => void;
  onCancel: () => void;
}> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    task_title: task.task_title,
    task_description: task.task_description || '',
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || '',
    estimated_duration: task.estimated_duration || 30,
    notes: task.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task_title">Title</Label>
              <Input
                id="task_title"
                value={formData.task_title}
                onChange={(e) => setFormData({...formData, task_title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="task_description">Description</Label>
              <Textarea
                id="task_description"
                value={formData.task_description}
                onChange={(e) => setFormData({...formData, task_description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: Task['priority']) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Task['status']) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">Update Task</Button>
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;
