
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkOperationsService } from '@/services/team/bulkOperationsService';
import { toast } from 'sonner';
import { Users, UserMinus, UserCheck, ArrowRight } from 'lucide-react';
import type { TeamMemberWithProfile } from '@/types/team-management';
import type { BulkMemberOperation } from '@/types/team-lifecycle';

interface BulkMemberOperationsProps {
  teamId: string;
  members: TeamMemberWithProfile[];
  onOperationComplete: () => void;
}

export function BulkMemberOperations({ 
  teamId, 
  members, 
  onOperationComplete 
}: BulkMemberOperationsProps) {
  const [operationType, setOperationType] = useState<'add' | 'remove' | 'update_role' | 'transfer'>('add');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [emailList, setEmailList] = useState('');
  const [newRole, setNewRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [targetTeamId, setTargetTeamId] = useState('');
  const queryClient = useQueryClient();

  const bulkOperationMutation = useMutation({
    mutationFn: async (operation: BulkMemberOperation) => {
      return bulkOperationsService.executeBulkOperation(teamId, operation, 'current-user-id');
    },
    onSuccess: () => {
      toast.success('Bulk operation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onOperationComplete();
      setSelectedMembers([]);
      setEmailList('');
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleExecuteOperation = () => {
    const operation: BulkMemberOperation = {
      type: operationType,
      member_ids: selectedMembers,
      user_emails: operationType === 'add' ? emailList.split('\n').filter(email => email.trim()) : undefined,
      new_role: operationType === 'update_role' ? newRole : undefined,
      target_team_id: operationType === 'transfer' ? targetTeamId : undefined
    };

    bulkOperationMutation.mutate(operation);
  };

  const canExecute = () => {
    switch (operationType) {
      case 'add':
        return emailList.trim().length > 0;
      case 'remove':
      case 'update_role':
        return selectedMembers.length > 0;
      case 'transfer':
        return selectedMembers.length > 0 && targetTeamId.length > 0;
      default:
        return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Member Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Operation Type Selection */}
        <div className="space-y-2">
          <Label>Operation Type</Label>
          <Select value={operationType} onValueChange={(value: any) => setOperationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Add Members
                </div>
              </SelectItem>
              <SelectItem value="remove">
                <div className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4" />
                  Remove Members
                </div>
              </SelectItem>
              <SelectItem value="update_role">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Update Roles
                </div>
              </SelectItem>
              <SelectItem value="transfer">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Transfer Members
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Members Form */}
        {operationType === 'add' && (
          <div className="space-y-2">
            <Label>Email Addresses (one per line)</Label>
            <Textarea
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              rows={5}
            />
          </div>
        )}

        {/* Member Selection for Other Operations */}
        {operationType !== 'add' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedMembers.length === members.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">Select All Members</Label>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={member.id}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) => handleMemberSelection(member.id, checked as boolean)}
                  />
                  <Label htmlFor={member.id} className="flex-1">
                    {member.display_name} ({member.role})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role Selection for Update Role */}
        {operationType === 'update_role' && (
          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Target Team for Transfer */}
        {operationType === 'transfer' && (
          <div className="space-y-2">
            <Label>Target Team ID</Label>
            <Input
              placeholder="Enter target team ID"
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
            />
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecuteOperation}
          disabled={!canExecute() || bulkOperationMutation.isPending}
          className="w-full"
        >
          {bulkOperationMutation.isPending ? 'Processing...' : `Execute ${operationType.replace('_', ' ')}`}
        </Button>
      </CardContent>
    </Card>
  );
}
