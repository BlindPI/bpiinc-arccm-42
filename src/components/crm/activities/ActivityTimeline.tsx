import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Phone, 
  Mail, 
  Users, 
  Calendar, 
  FileText, 
  Clock,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Video,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Target
} from 'lucide-react';
import { crmActivityService } from '@/services/crm/crmActivityService';
import { CRMActivity, CreateActivityData, ActivityFilters } from '@/types/crm';

interface ActivityTimelineProps {
  leadId?: string;
  opportunityId?: string;
  showCreateButton?: boolean;
  maxHeight?: string;
}

export function ActivityTimeline({ 
  leadId, 
  opportunityId, 
  showCreateButton = true,
  maxHeight = "600px"
}: ActivityTimelineProps) {
  const [filters, setFilters] = useState<ActivityFilters>({
    lead_id: leadId,
    opportunity_id: opportunityId
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CRMActivity | null>(null);
  const [newActivity, setNewActivity] = useState<Partial<CreateActivityData>>({
    activity_type: 'call',
    activity_date: new Date().toISOString().split('T')[0],
    outcome: 'neutral'
  });

  const queryClient = useQueryClient();

  // Real activity data
  const { data: activitiesResponse, isLoading, error } = useQuery({
    queryKey: ['crm', 'activities', leadId, opportunityId, filters],
    queryFn: async () => {
      const result = await crmActivityService.getActivities(filters, 1, 100);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30000,
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: CreateActivityData) => {
      const result = await crmActivityService.createActivity(activityData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'activities'] });
      setShowCreateDialog(false);
      setNewActivity({
        activity_type: 'call',
        activity_date: new Date().toISOString().split('T')[0],
        outcome: 'neutral'
      });
    },
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<CRMActivity> }) => {
      const result = await crmActivityService.updateActivity(id, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'activities'] });
      setEditingActivity(null);
    },
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const result = await crmActivityService.deleteActivity(activityId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });

  const activities = activitiesResponse?.data || [];

  const getActivityIcon = (type: string) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Users,
      demo: Target,
      proposal: FileText,
      follow_up: Clock
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      call: 'text-blue-600 bg-blue-100',
      email: 'text-green-600 bg-green-100',
      meeting: 'text-purple-600 bg-purple-100',
      demo: 'text-orange-600 bg-orange-100',
      proposal: 'text-red-600 bg-red-100',
      follow_up: 'text-yellow-600 bg-yellow-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'no_response':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    const styles = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-yellow-100 text-yellow-800',
      no_response: 'bg-gray-100 text-gray-800'
    };
    return styles[outcome as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getMeetingTypeIcon = (meetingType?: string) => {
    switch (meetingType) {
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'in_person':
        return <MapPin className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-CA');
    }
  };

  const handleCreateActivity = () => {
    if (!newActivity.subject || !newActivity.activity_type) return;

    const activityData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: newActivity.activity_type as any,
      subject: newActivity.subject,
      description: newActivity.description,
      activity_date: newActivity.activity_date || new Date().toISOString(),
      duration_minutes: newActivity.duration_minutes,
      outcome: newActivity.outcome as any,
      outcome_notes: newActivity.outcome_notes,
      interest_level: newActivity.interest_level,
      follow_up_required: newActivity.follow_up_required,
      follow_up_date: newActivity.follow_up_date,
      follow_up_type: newActivity.follow_up_type,
      meeting_type: newActivity.meeting_type as any,
      location: newActivity.location
    };

    createActivityMutation.mutate(activityData);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      deleteActivityMutation.mutate(activityId);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading activities: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Activity Timeline</h3>
          <p className="text-sm text-gray-600">
            {activities.length} activities recorded
          </p>
        </div>
        {showCreateButton && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log New Activity</DialogTitle>
                <DialogDescription>
                  Record an interaction with this lead or opportunity
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Activity Type</Label>
                  <Select
                    value={newActivity.activity_type}
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newActivity.activity_date?.slice(0, 16)}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, activity_date: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Subject</Label>
                  <Input
                    value={newActivity.subject || ''}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of the activity"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newActivity.description || ''}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed notes about the activity"
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Outcome</Label>
                  <Select
                    value={newActivity.outcome}
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, outcome: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="no_response">No Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Interest Level (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newActivity.interest_level || ''}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, interest_level: parseInt(e.target.value) }))}
                  />
                </div>

                {(newActivity.activity_type === 'call' || newActivity.activity_type === 'meeting') && (
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newActivity.duration_minutes || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    />
                  </div>
                )}

                {newActivity.activity_type === 'meeting' && (
                  <div>
                    <Label>Meeting Type</Label>
                    <Select
                      value={newActivity.meeting_type}
                      onValueChange={(value) => setNewActivity(prev => ({ ...prev, meeting_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateActivity}
                  disabled={createActivityMutation.isPending || !newActivity.subject}
                >
                  {createActivityMutation.isPending ? 'Saving...' : 'Log Activity'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities recorded</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your interactions by logging your first activity
              </p>
              {showCreateButton && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log First Activity
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          activities.map((activity, index) => {
            const ActivityIcon = getActivityIcon(activity.activity_type);
            const isLast = index === activities.length - 1;
            
            return (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200 -z-10" />
                )}
                
                <Card className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Activity Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                        <ActivityIcon className="h-5 w-5" />
                      </div>
                      
                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{activity.subject}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(activity.activity_date)}
                              </span>
                              {activity.duration_minutes && (
                                <span className="text-xs text-gray-500">
                                  • {activity.duration_minutes} min
                                </span>
                              )}
                              {activity.meeting_type && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  • {getMeetingTypeIcon(activity.meeting_type)}
                                  {activity.meeting_type}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {activity.outcome && (
                              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getOutcomeBadge(activity.outcome)}`}>
                                {getOutcomeIcon(activity.outcome)}
                                <span className="ml-1 capitalize">{activity.outcome.replace('_', ' ')}</span>
                              </div>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingActivity(activity)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Activity
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteActivity(activity.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Activity
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Activity Description */}
                        {activity.description && (
                          <div className="mt-2 text-sm text-gray-600">
                            {activity.description}
                          </div>
                        )}
                        
                        {/* Activity Details */}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                          {activity.interest_level && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Interest: {activity.interest_level}/10
                            </div>
                          )}
                          {activity.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </div>
                          )}
                          {activity.follow_up_required && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-3 w-3" />
                              Follow-up required
                              {activity.follow_up_date && (
                                <span>by {new Date(activity.follow_up_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Outcome Notes */}
                        {activity.outcome_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Outcome Notes:</strong> {activity.outcome_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}