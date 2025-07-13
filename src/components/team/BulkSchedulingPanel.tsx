import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBulkOperation, useBulkOperations } from '@/hooks/team/useTeamManagement';
import { Calendar, Clock, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { BulkSchedulingData } from '@/services/team/teamManagementService';

interface BulkSchedulingPanelProps {
  teamId: string;
  teamMembers: Array<{
    userId: string;
    userName: string;
    userRole: string;
  }>;
}

export function BulkSchedulingPanel({ teamId, teamMembers }: BulkSchedulingPanelProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    operationType: 'bulk_schedule' as const,
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    bookingType: 'training',
    title: '',
    description: '',
    requiresApproval: false
  });

  const { createBulkOperation, processBulkOperation } = useBulkOperation();
  const { data: recentOperations, isLoading: operationsLoading } = useBulkOperations(10);

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(teamMembers.map(m => m.userId));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMembers.length === 0) {
      return;
    }

    const bulkData: BulkSchedulingData = {
      operationType: formData.operationType,
      targetUsers: selectedMembers,
      scheduleData: {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        bookingType: formData.bookingType,
        title: formData.title,
        description: formData.description,
        requiresApproval: formData.requiresApproval
      }
    };

    try {
      const operation = await createBulkOperation.mutateAsync(bulkData);
      // Auto-process the operation
      await processBulkOperation.mutateAsync(operation.id);
      
      // Reset form
      setSelectedMembers([]);
      setFormData({
        ...formData,
        title: '',
        description: ''
      });
    } catch (error) {
      console.error('Failed to create bulk operation:', error);
    }
  };

  const getOperationStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Bulk Scheduling Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Team Members</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedMembers.length === teamMembers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                    Select All ({teamMembers.length})
                  </Label>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-2">
                {teamMembers.map(member => (
                  <div key={member.userId} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.userId}
                      checked={selectedMembers.includes(member.userId)}
                      onCheckedChange={(checked) => handleMemberToggle(member.userId, checked as boolean)}
                    />
                    <Label htmlFor={member.userId} className="flex-1 cursor-pointer">
                      <span className="font-medium">{member.userName}</span>
                      <span className="text-sm text-muted-foreground ml-2">({member.userRole})</span>
                    </Label>
                  </div>
                ))}
              </div>

              {selectedMembers.length > 0 && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected for bulk operation
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Schedule Details */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="booking-type">Booking Type</Label>
                  <Select
                    value={formData.bookingType}
                    onValueChange={(value) => setFormData({ ...formData, bookingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Team Training Session"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the scheduled activity..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires-approval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked as boolean })}
                />
                <Label htmlFor="requires-approval" className="text-sm">
                  Require manager approval before scheduling
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={selectedMembers.length === 0 || createBulkOperation.isPending || processBulkOperation.isPending}
            >
              {createBulkOperation.isPending || processBulkOperation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule for {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operationsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentOperations?.map(operation => (
                <div key={operation.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getOperationStatusColor(operation.status)}>
                        {getOperationIcon(operation.status)}
                        {operation.status}
                      </Badge>
                      <span className="font-medium text-sm">
                        {operation.operation_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(operation.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Target: {operation.target_users.length} members</div>
                    <div>Progress: {operation.processed_count}/{operation.total_count}</div>
                    {operation.error_log && Array.isArray(operation.error_log) && operation.error_log.length > 0 && (
                      <div className="text-red-600 text-xs mt-1">
                        {operation.error_log.length} error(s) occurred
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!recentOperations || recentOperations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bulk operations yet</p>
                  <p className="text-sm">Create your first bulk schedule above</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}