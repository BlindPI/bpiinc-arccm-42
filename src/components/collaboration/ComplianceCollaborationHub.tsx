import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  Search,
  Filter,
  Calendar,
  Bell,
  MoreVertical,
  Download,
  Upload,
  Share2,
  Eye,
  Edit,
  Trash2,
  Star,
  Flag,
  X
} from 'lucide-react';
import { ComplianceService, UserComplianceRecord } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceCollaborationHubProps {
  userId: string;
  teamId?: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  onTaskAssigned?: (task: CollaborationTask) => void;
}

interface CollaborationTask {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name: string;
  assignee_avatar?: string;
  creator_id: string;
  creator_name: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  created_at: string;
  updated_at: string;
  compliance_metric_id?: string;
  compliance_metric_name?: string;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  progress_percentage: number;
}

interface TaskAttachment {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  download_url: string;
}

interface TaskComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  is_system_message: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  last_active: string;
  compliance_records_count: number;
  completed_tasks: number;
  pending_tasks: number;
}

interface ActivityFeedItem {
  id: string;
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'comment_added' | 'file_uploaded' | 'compliance_updated';
  title: string;
  description: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export function ComplianceCollaborationHub({
  userId,
  teamId,
  role,
  onTaskAssigned
}: ComplianceCollaborationHubProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'activity' | 'files'>('tasks');
  const [tasks, setTasks] = useState<CollaborationTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Task management state
  const [selectedTask, setSelectedTask] = useState<CollaborationTask | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'assigned' | 'created' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  
  // Comment state
  const [newComment, setNewComment] = useState('');

  // Load collaboration data
  const loadCollaborationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load tasks (simulated with compliance records for now)
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Transform compliance records into collaboration tasks
      const collaborationTasks: CollaborationTask[] = userRecords.map(record => ({
        id: record.id,
        title: record.compliance_metrics?.name || 'Compliance Task',
        description: record.compliance_metrics?.description || 'Compliance requirement task',
        assignee_id: userId,
        assignee_name: 'Current User',
        creator_id: userId,
        creator_name: 'Current User',
        status: mapComplianceStatusToTaskStatus(record.compliance_status),
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: record.created_at,
        updated_at: record.updated_at,
        compliance_metric_id: record.compliance_metrics?.name,
        compliance_metric_name: record.compliance_metrics?.name,
        tags: [record.compliance_metrics?.category || 'compliance'],
        attachments: [],
        comments: [],
        progress_percentage: getProgressFromStatus(record.compliance_status)
      }));

      setTasks(collaborationTasks);

      // Load team members (simulated)
      const mockTeamMembers: TeamMember[] = [
        {
          id: userId,
          name: 'Current User',
          email: 'user@company.com',
          role: role,
          status: 'online',
          last_active: new Date().toISOString(),
          compliance_records_count: userRecords.length,
          completed_tasks: userRecords.filter(r => r.compliance_status === 'compliant').length,
          pending_tasks: userRecords.filter(r => r.compliance_status === 'pending').length
        }
      ];

      setTeamMembers(mockTeamMembers);

      // Load activity feed (simulated)
      const mockActivity: ActivityFeedItem[] = collaborationTasks.slice(0, 10).map(task => ({
        id: `activity-${task.id}`,
        type: 'task_created',
        title: 'Task Created',
        description: `Created task: ${task.title}`,
        user_id: userId,
        user_name: 'Current User',
        created_at: task.created_at,
        metadata: { task_id: task.id }
      }));

      setActivityFeed(mockActivity);

    } catch (error) {
      console.error('Failed to load collaboration data:', error);
      setError('Failed to load collaboration data. Please try again.');
      toast.error('Failed to load collaboration data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  // Real-time collaboration updates
  useEffect(() => {
    const channel = supabase
      .channel(`collaboration-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        console.log('Real-time collaboration update:', payload);
        await loadCollaborationData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadCollaborationData]);

  // Load data on mount
  useEffect(() => {
    loadCollaborationData();
  }, [loadCollaborationData]);

  // Helper functions
  const mapComplianceStatusToTaskStatus = (status: string): CollaborationTask['status'] => {
    switch (status) {
      case 'compliant': return 'completed';
      case 'warning': return 'review';
      case 'non_compliant': return 'pending';
      case 'pending': return 'pending';
      default: return 'pending';
    }
  };

  const getProgressFromStatus = (status: string): number => {
    switch (status) {
      case 'compliant': return 100;
      case 'warning': return 75;
      case 'non_compliant': return 25;
      case 'pending': return 0;
      default: return 0;
    }
  };

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    switch (taskFilter) {
      case 'assigned':
        filtered = filtered.filter(task => task.assignee_id === userId);
        break;
      case 'created':
        filtered = filtered.filter(task => task.creator_id === userId);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [tasks, searchQuery, taskFilter, userId]);

  // Handle task creation
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskAssignee) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newTask: CollaborationTask = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDescription,
        assignee_id: newTaskAssignee,
        assignee_name: teamMembers.find(m => m.id === newTaskAssignee)?.name || 'Unknown',
        creator_id: userId,
        creator_name: 'Current User',
        status: 'pending',
        priority: newTaskPriority,
        due_date: newTaskDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: newTaskTags,
        attachments: [],
        comments: [],
        progress_percentage: 0
      };

      setTasks(prev => [newTask, ...prev]);
      
      // Clear form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setNewTaskTags([]);
      setShowCreateTask(false);

      toast.success('Task created successfully');
      
      if (onTaskAssigned) {
        onTaskAssigned(newTask);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  // Handle task status update
  const handleTaskStatusUpdate = async (taskId: string, newStatus: CollaborationTask['status']) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              progress_percentage: newStatus === 'completed' ? 100 : task.progress_percentage
            }
          : task
      ));

      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Handle adding comment
  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;

    try {
      const comment: TaskComment = {
        id: `comment-${Date.now()}`,
        user_id: userId,
        user_name: 'Current User',
        content: newComment,
        created_at: new Date().toISOString(),
        is_system_message: false
      };

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...task.comments, comment] }
          : task
      ));

      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: CollaborationTask['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'review': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: CollaborationTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Render task card
  const renderTaskCard = (task: CollaborationTask) => (
    <Card key={task.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium">{task.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'in_progress')}>
                <Edit className="h-4 w-4 mr-2" />
                Mark In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'completed')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant={getStatusBadgeVariant(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(task.priority)}>
            {task.priority}
          </Badge>
          {task.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {task.assignee_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span>{task.assignee_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{task.progress_percentage}%</span>
          </div>
          <Progress value={task.progress_percentage} className="h-2" />
        </div>

        {task.comments.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{task.comments.length} comments</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render team member card
  const renderTeamMemberCard = (member: TeamMember) => (
    <Card key={member.id} className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} />
          <AvatarFallback>
            {member.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{member.name}</h4>
            <div className={cn(
              "w-2 h-2 rounded-full",
              member.status === 'online' && "bg-green-500",
              member.status === 'busy' && "bg-red-500",
              member.status === 'away' && "bg-yellow-500",
              member.status === 'offline' && "bg-gray-400"
            )} />
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <Badge variant="outline">{member.role}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-blue-600">{member.compliance_records_count}</div>
          <div className="text-xs text-muted-foreground">Records</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">{member.completed_tasks}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-600">{member.pending_tasks}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
      </div>
    </Card>
  );

  // Render activity item
  const renderActivityItem = (item: ActivityFeedItem) => (
    <div key={item.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-md">
      <Avatar className="h-8 w-8">
        <AvatarImage src={item.user_avatar} />
        <AvatarFallback className="text-xs">
          {item.user_name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{item.user_name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm">{item.description}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading collaboration hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Collaboration Hub</h2>
          <p className="text-muted-foreground">
            Coordinate team-based compliance management and track progress together
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tasks ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Task Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Button
                  variant={taskFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTaskFilter('all')}
                >
                  All Tasks
                </Button>
                <Button
                  variant={taskFilter === 'assigned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTaskFilter('assigned')}
                >
                  Assigned to Me
                </Button>
                <Button
                  variant={taskFilter === 'created' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTaskFilter('created')}
                >
                  Created by Me
                </Button>
                <Button
                  variant={taskFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTaskFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Create your first collaboration task to get started'}
                    </p>
                    <Button onClick={() => setShowCreateTask(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map(renderTaskCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map(renderTeamMemberCard)}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  activityFeed.map(renderActivityItem)
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">File Collaboration</h3>
                <p className="text-muted-foreground mb-4">
                  File sharing and collaboration features will be available here
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      {showCreateTask && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Task</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateTask(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Assignee *</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {newTaskAssignee ? 
                        teamMembers.find(m => m.id === newTaskAssignee)?.name || 'Select assignee' : 
                        'Select assignee'
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {teamMembers.map(member => (
                      <DropdownMenuItem key={member.id} onClick={() => setNewTaskAssignee(member.id)}>
                        {member.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {newTaskPriority}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setNewTaskPriority('low')}>Low</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewTaskPriority('medium')}>Medium</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewTaskPriority('high')}>High</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewTaskPriority('urgent')}>Urgent</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateTask(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} className="flex-1">
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Progress</h4>
                <Progress value={selectedTask.progress_percentage} className="mb-2" />
                <span className="text-sm text-muted-foreground">{selectedTask.progress_percentage}%</span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Comments ({selectedTask.comments.length})</h4>
                <div className="space-y-3 mb-4">
                  {selectedTask.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.user_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(selectedTask.id);
                      }
                    }}
                  />
                  <Button onClick={() => handleAddComment(selectedTask.id)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}