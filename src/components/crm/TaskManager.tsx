import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskManagementService, Task, Activity, TaskMetrics } from '@/services/crm/taskManagementService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  Tag,
  Phone,
  Mail,
  Users,
  FileText,
  Target,
  TrendingUp,
  Activity as ActivityIcon,
  Timer,
  Flag,
  Filter,
  Search
} from 'lucide-react';

interface TaskManagerProps {
  className?: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ className }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    task_type: 'all',
    assigned_to: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => TaskManagementService.getTasks({
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.priority !== 'all' && { priority: filters.priority }),
      ...(filters.task_type !== 'all' && { task_type: filters.task_type }),
      ...(filters.assigned_to !== 'all' && { assigned_to: filters.assigned_to }),
      include_subtasks: true
    })
  });

  // Fetch activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => TaskManagementService.getActivities()
  });

  // Fetch task metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['task-metrics'],
    queryFn: () => TaskManagementService.getTaskMetrics()
  });

  // Fetch overdue tasks
  const { data: overdueTasks = [] } = useQuery({
    queryKey: ['overdue-tasks'],
    queryFn: () => TaskManagementService.getOverdueTasks()
  });

  // Fetch upcoming tasks
  const { data: upcomingTasks = [] } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => TaskManagementService.getUpcomingTasks()
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: TaskManagementService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-tasks'] });
      setIsCreateDialogOpen(false);
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      TaskManagementService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-tasks'] });
      setIsEditDialogOpen(false);
      setSelectedTask(null);
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ id, duration, notes }: { id: string; duration?: number; notes?: string }) =>
      TaskManagementService.completeTask(id, duration, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: TaskManagementService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-metrics'] });
    }
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: TaskManagementService.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  });

  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.task_title.toLowerCase().includes(query) ||
        task.task_description?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'follow_up': return <Target className="h-4 w-4" />;
      case 'demo': return <FileText className="h-4 w-4" />;
      case 'proposal': return <FileText className="h-4 w-4" />;
      case 'contract': return <FileText className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      return `Due in ${diffDays} days`;
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isLoading = isLoadingTasks || isLoadingActivities || isLoadingMetrics;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task & Activity Management</h2>
          <p className="text-muted-foreground">
            Manage tasks, track activities, and monitor productivity
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to track your work
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmit={(data) => createTaskMutation.mutate(data)}
              isLoading={createTaskMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      {metrics && !isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.completed_tasks} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completion_rate.toFixed(1)}%</div>
              <Progress value={metrics.completion_rate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.overdue_tasks}</div>
              <p className="text-xs text-muted-foreground">
                Need immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.productivity_score.toFixed(0)}</div>
              <Progress value={metrics.productivity_score} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTasks.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.task_type} onValueChange={(value) => setFilters({ ...filters, task_type: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              completeTaskMutation.mutate({ id: task.id });
                            }
                          }}
                          disabled={completeTaskMutation.isPending}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getTaskTypeIcon(task.task_type)}
                            <CardTitle className={`text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.task_title}
                            </CardTitle>
                          </div>
                          {task.task_description && (
                            <CardDescription>{task.task_description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          <Flag className="mr-1 h-3 w-3" />
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{formatDate(task.due_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{formatDuration(task.estimated_duration)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigned To</p>
                        <p className="font-medium">{task.assigned_to || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{task.task_type.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Subtasks ({task.subtasks.length}):</p>
                        <div className="space-y-1">
                          {task.subtasks.slice(0, 3).map((subtask) => (
                            <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                              <Checkbox
                                checked={subtask.status === 'completed'}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    completeTaskMutation.mutate({ id: subtask.id });
                                  }
                                }}
                                disabled={completeTaskMutation.isPending}
                              />
                              <span className={subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                {subtask.task_title}
                              </span>
                            </div>
                          ))}
                          {task.subtasks.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{task.subtasks.length - 3} more subtasks
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created {(() => {
                          try {
                            const date = new Date(task.created_at);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                          } catch (error) {
                            console.warn('Error formatting created_at:', task.created_at, error);
                            return 'Invalid Date';
                          }
                        })()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          disabled={deleteTaskMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredTasks.length === 0 && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || Object.values(filters).some(f => f !== 'all')
                    ? 'Try adjusting your search or filters'
                    : 'Create your first task to get started'
                  }
                </p>
                {!searchQuery && Object.values(filters).every(f => f === 'all') && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <div className="space-y-4">
            {overdueTasks.map((task) => (
              <Card key={task.id} className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <CardTitle className="text-lg text-red-900">{task.task_title}</CardTitle>
                        <CardDescription className="text-red-700">
                          {formatDate(task.due_date)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-red-700">
                      Priority: {task.priority} • Type: {task.task_type}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => completeTaskMutation.mutate({ id: task.id })}
                      disabled={completeTaskMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {overdueTasks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No overdue tasks!</h3>
                <p className="text-muted-foreground text-center">
                  Great job staying on top of your tasks
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <Card key={task.id} className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <CardTitle className="text-lg text-blue-900">{task.task_title}</CardTitle>
                        <CardDescription className="text-blue-700">
                          {formatDate(task.due_date)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {task.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-700">
                      Duration: {formatDuration(task.estimated_duration)} • Type: {task.task_type}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {upcomingTasks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming tasks</h3>
                <p className="text-muted-foreground text-center">
                  No tasks due in the next 7 days
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-4">
            {activities.slice(0, 20).map((activity) => (
              <Card key={activity.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <ActivityIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <CardTitle className="text-base">{activity.activity_title}</CardTitle>
                      <CardDescription>
                        {activity.activity_description}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>{(() => {
                          try {
                            const date = new Date(activity.activity_date);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                          } catch (error) {
                            console.warn('Error formatting activity_date:', activity.activity_date, error);
                            return 'Invalid Date';
                          }
                        })()}</span>
                        {activity.duration && (
                          <span>Duration: {formatDuration(activity.duration)}</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {(activity.outcome || activity.next_steps) && (
                  <CardContent className="pt-0">
                    {activity.outcome && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Outcome:</p>
                        <p className="text-sm text-muted-foreground">{activity.outcome}</p>
                      </div>
                    )}
                    {activity.next_steps && (
                      <div>
                        <p className="text-sm font-medium">Next Steps:</p>
                        <p className="text-sm text-muted-foreground">{activity.next_steps}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {activities.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activities recorded</h3>
                <p className="text-muted-foreground text-center">
                  Activities will appear here as you complete tasks and log interactions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              onSubmit={(data) => updateTaskMutation.mutate({
                id: selectedTask.id,
                updates: data
              })}
              isLoading={updateTaskMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Task Form Component
interface TaskFormProps {
  task?: Task;
  onSubmit: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'subtasks'>) => void;
  isLoading: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    task_title: task?.task_title || '',
    task_description: task?.task_description || '',
    task_type: task?.task_type || 'other',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    due_date: task?.due_date || '',
    estimated_duration: task?.estimated_duration || 60,
    assigned_to: task?.assigned_to || '',
    lead_id: task?.lead_id || '',
    opportunity_id: task?.opportunity_id || '',
    contact_id: task?.contact_id || '',
    tags: task?.tags || [],
    notes: task?.notes || '',
    reminder_date: task?.reminder_date || '',
    is_recurring: task?.is_recurring || false,
    parent_task_id: task?.parent_task_id || ''
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      actual_duration: task?.actual_duration,
      completed_date: task?.completed_date,
      created_by: task?.created_by,
      recurrence_pattern: task?.recurrence_pattern,
      attachments: task?.attachments
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task_title">Task Title</Label>
          <Input
            id="task_title"
            value={formData.task_title}
            onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
            placeholder="Enter task title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task_type">Task Type</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value) => setFormData({ ...formData, task_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="demo">Demo</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task_description">Description</Label>
        <Textarea
          id="task_description"
          value={formData.task_description}
          onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
          placeholder="Describe the task..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
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
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
          <Input
            id="estimated_duration"
            type="number"
            min="1"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Input
            id="assigned_to"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            placeholder="Enter assignee"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder_date">Reminder Date</Label>
          <Input
            id="reminder_date"
            type="datetime-local"
            value={formData.reminder_date}
            onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};