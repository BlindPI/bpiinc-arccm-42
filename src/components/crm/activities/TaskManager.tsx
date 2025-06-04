import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  Search,
  Target,
  Flag,
  Bell,
  Users,
  Building,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { CRMTask, CreateTaskData } from '@/types/crm';

// Mock task service (in real implementation, this would be a proper service)
const mockTaskService = {
  async getTasks(filters: any = {}) {
    // Mock data - in real implementation, this would call the backend
    const tasks: CRMTask[] = [
      {
        id: 'task-1',
        lead_id: 'lead-1',
        task_title: 'Follow up with ABC Construction',
        description: 'Call to discuss training needs for 25 employees',
        task_type: 'follow_up',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'pending',
        assigned_to: 'user-1',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'task-2',
        opportunity_id: 'opp-1',
        task_title: 'Send proposal to XYZ Healthcare',
        description: 'Prepare and send detailed training proposal',
        task_type: 'proposal',
        priority: 'urgent',
        due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
        status: 'in_progress',
        assigned_to: 'user-2',
        created_by: 'user-1',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'task-3',
        lead_id: 'lead-2',
        task_title: 'Schedule demo for potential AP',
        description: 'Coordinate site visit and demonstration',
        task_type: 'demo',
        priority: 'medium',
        due_date: new Date(Date.now() + 259200000).toISOString(), // 3 days
        status: 'pending',
        assigned_to: 'user-3',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { success: true, data: { data: tasks, total: tasks.length } };
  },

  async createTask(taskData: CreateTaskData) {
    const newTask: CRMTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { success: true, data: newTask };
  },

  async updateTask(taskId: string, updates: Partial<CRMTask>) {
    return { success: true, data: { id: taskId, ...updates } };
  },

  async completeTask(taskId: string, completionNotes?: string) {
    return { success: true, data: { id: taskId, status: 'completed', completion_notes: completionNotes } };
  },

  async deleteTask(taskId: string) {
    return { success: true };
  }
};

interface TaskManagerProps {
  leadId?: string;
  opportunityId?: string;
  assignedTo?: string;
}

export function TaskManager({ leadId, opportunityId, assignedTo }: TaskManagerProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    task_type: '',
    assigned_to: assignedTo || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [newTask, setNewTask] = useState<Partial<CreateTaskData>>({
    priority: 'medium',
    task_type: 'follow_up'
  });

  const queryClient = useQueryClient();

  // Real task data
  const { data: tasksResponse, isLoading, error } = useQuery({
    queryKey: ['crm', 'tasks', leadId, opportunityId, filters, searchTerm],
    queryFn: async () => {
      const taskFilters = {
        lead_id: leadId,
        opportunity_id: opportunityId,
        ...filters
      };
      return await mockTaskService.getTasks(taskFilters);
    },
    staleTime: 30000,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      return await mockTaskService.createTask(taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'tasks'] });
      setShowCreateDialog(false);
      setNewTask({ priority: 'medium', task_type: 'follow_up' });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, completionNotes }: { taskId: string, completionNotes?: string }) => {
      return await mockTaskService.completeTask(taskId, completionNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'tasks'] });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string, updates: Partial<CRMTask> }) => {
      return await mockTaskService.updateTask(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'tasks'] });
      setEditingTask(null);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await mockTaskService.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'tasks'] });
    },
  });

  const tasks = tasksResponse?.data?.data || [];

  // Filter tasks based on active tab and search
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && task.status === 'pending') ||
      (activeTab === 'overdue' && isOverdue(task)) ||
      (activeTab === 'completed' && task.status === 'completed');

    return matchesSearch && matchesTab;
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTaskTypeIcon = (type: string) => {
    const icons = {
      follow_up: Phone,
      proposal: FileText,
      demo: Target,
      contract_review: Building,
      onboarding: Users
    };
    return icons[type as keyof typeof icons] || Clock;
  };

  const isOverdue = (task: CRMTask): boolean => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else {
      return `In ${diffDays} days`;
    }
  };

  const handleCreateTask = () => {
    if (!newTask.task_title) return;

    const taskData: CreateTaskData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      task_title: newTask.task_title,
      description: newTask.description,
      task_type: newTask.task_type,
      priority: newTask.priority as any,
      due_date: newTask.due_date,
      reminder_date: newTask.reminder_date,
      assigned_to: newTask.assigned_to
    };

    createTaskMutation.mutate(taskData);
  };

  const handleCompleteTask = (task: CRMTask) => {
    const completionNotes = prompt('Add completion notes (optional):');
    completeTaskMutation.mutate({ 
      taskId: task.id, 
      completionNotes: completionNotes || undefined 
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Count tasks by status
  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600">
            Track and manage your sales tasks and follow-ups
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to track important follow-ups and activities
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Task Title</Label>
                <Input
                  value={newTask.task_title || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description and notes"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label>Task Type</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, task_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="contract_review">Contract Review</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}
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
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date?.split('T')[0] || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Reminder Date</Label>
                <Input
                  type="date"
                  value={newTask.reminder_date?.split('T')[0] || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, reminder_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending || !newTask.task_title}
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Tasks
            <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
              {taskCounts.all}
            </div>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
              {taskCounts.pending}
            </div>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            Overdue
            <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
              {taskCounts.overdue}
            </div>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            Completed
            <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
              {taskCounts.completed}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first task to get started'
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const TaskIcon = getTaskTypeIcon(task.task_type || 'follow_up');
                const isTaskOverdue = isOverdue(task);
                
                return (
                  <Card key={task.id} className={`${isTaskOverdue ? 'border-red-300 bg-red-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            <Checkbox
                              checked={task.status === 'completed'}
                              onCheckedChange={() => {
                                if (task.status !== 'completed') {
                                  handleCompleteTask(task);
                                }
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TaskIcon className="h-4 w-4 text-gray-600" />
                              <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                {task.task_title}
                              </h4>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {task.due_date && (
                                <div className={`flex items-center gap-1 ${isTaskOverdue ? 'text-red-600' : ''}`}>
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.due_date)}
                                </div>
                              )}
                              {task.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Assigned
                                </div>
                              )}
                              {task.reminder_date && (
                                <div className="flex items-center gap-1">
                                  <Bell className="h-3 w-3" />
                                  Reminder set
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' && <Flag className="h-3 w-3 mr-1" />}
                            {task.priority}
                          </div>
                          
                          <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {task.status === 'pending' && isTaskOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {task.status.replace('_', ' ')}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              {task.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => handleCompleteTask(task)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}