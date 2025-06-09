
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMemberService } from '@/services/team/teamMemberService';
import { toast } from 'sonner';
import { Users, Settings, Trash2, UserX, X } from 'lucide-react';

interface BulkMemberOperationsPanelProps {
  teamId: string;
  selectedMembers: string[];
  onOperationComplete: () => void;
  onClose?: () => void;
}

export function BulkMemberOperationsPanel({ 
  teamId, 
  selectedMembers, 
  onOperationComplete,
  onClose 
}: BulkMemberOperationsPanelProps) {
  const queryClient = useQueryClient();
  const [operationType, setOperationType] = useState<string>('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'on_leave' | 'suspended'>('active');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const bulkUpdateRoles = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const total = selectedMembers.length;
      let completed = 0;
      const errors: string[] = [];

      for (const userId of selectedMembers) {
        try {
          await teamMemberService.updateMemberRole(teamId, userId, newRole);
          completed++;
          setProgress((completed / total) * 100);
        } catch (error) {
          errors.push(`Failed to update role for user ${userId}`);
        }
      }

      return { completed, total, errors };
    },
    onSuccess: (result) => {
      toast.success(`Bulk role update completed: ${result.completed}/${result.total} successful`);
      if (result.errors.length > 0) {
        console.error('Bulk operation errors:', result.errors);
      }
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onOperationComplete();
      setIsProcessing(false);
      setProgress(0);
    },
    onError: () => {
      toast.error('Bulk role update failed');
      setIsProcessing(false);
      setProgress(0);
    }
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const total = selectedMembers.length;
      let completed = 0;
      const errors: string[] = [];

      for (const userId of selectedMembers) {
        try {
          await teamMemberService.updateMemberStatus(teamId, userId, newStatus);
          completed++;
          setProgress((completed / total) * 100);
        } catch (error) {
          errors.push(`Failed to update status for user ${userId}`);
        }
      }

      return { completed, total, errors };
    },
    onSuccess: (result) => {
      toast.success(`Bulk status update completed: ${result.completed}/${result.total} successful`);
      if (result.errors.length > 0) {
        console.error('Bulk operation errors:', result.errors);
      }
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onOperationComplete();
      setIsProcessing(false);
      setProgress(0);
    },
    onError: () => {
      toast.error('Bulk status update failed');
      setIsProcessing(false);
      setProgress(0);
    }
  });

  const bulkRemoveMembers = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const total = selectedMembers.length;
      let completed = 0;
      const errors: string[] = [];

      for (const userId of selectedMembers) {
        try {
          await teamMemberService.removeTeamMember(teamId, userId);
          completed++;
          setProgress((completed / total) * 100);
        } catch (error) {
          errors.push(`Failed to remove user ${userId}`);
        }
      }

      return { completed, total, errors };
    },
    onSuccess: (result) => {
      toast.success(`Bulk member removal completed: ${result.completed}/${result.total} successful`);
      if (result.errors.length > 0) {
        console.error('Bulk operation errors:', result.errors);
      }
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onOperationComplete();
      setIsProcessing(false);
      setProgress(0);
    },
    onError: () => {
      toast.error('Bulk member removal failed');
      setIsProcessing(false);
      setProgress(0);
    }
  });

  const handleExecuteOperation = () => {
    if (!operationType) {
      toast.error('Please select an operation type');
      return;
    }

    switch (operationType) {
      case 'update_roles':
        bulkUpdateRoles.mutate();
        break;
      case 'update_status':
        bulkUpdateStatus.mutate();
        break;
      case 'remove_members':
        if (window.confirm(`Are you sure you want to remove ${selectedMembers.length} members from this team?`)) {
          bulkRemoveMembers.mutate();
        }
        break;
      default:
        toast.error('Invalid operation type');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Member Operations
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Summary */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedMembers.length} members selected for bulk operation
          </span>
        </div>

        {/* Operation Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="operation-type">Operation Type</Label>
          <Select value={operationType} onValueChange={setOperationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select operation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update_roles">Update Roles</SelectItem>
              <SelectItem value="update_status">Update Status</SelectItem>
              <SelectItem value="remove_members">Remove Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Operation-specific Configuration */}
        {operationType === 'update_roles' && (
          <div className="space-y-2">
            <Label htmlFor="new-role">New Role</Label>
            <Select value={newRole} onValueChange={(value: 'ADMIN' | 'MEMBER') => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Team Administrator</SelectItem>
                <SelectItem value="MEMBER">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {operationType === 'update_status' && (
          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            <Select value={newStatus} onValueChange={(value: 'active' | 'inactive' | 'on_leave' | 'suspended') => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {operationType === 'remove_members' && (
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <UserX className="h-4 w-4" />
              <span className="font-medium">Warning: This action cannot be undone</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Removing members will permanently delete their team association and access permissions.
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this bulk operation..."
            rows={3}
          />
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={handleExecuteOperation}
            disabled={!operationType || isProcessing}
            variant={operationType === 'remove_members' ? 'destructive' : 'default'}
            className="flex-1"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                {operationType === 'remove_members' && <Trash2 className="h-4 w-4 mr-2" />}
                Execute Operation
              </>
            )}
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
