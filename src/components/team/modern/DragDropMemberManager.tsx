import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Crown,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

interface DragDropMemberManagerProps {
  teams: EnhancedTeam[];
  availableUsers: Array<{
    id: string;
    display_name: string;
    email?: string;
    role: string;
    avatar_url?: string;
  }>;
  onMemberTransfer: (userId: string, fromTeamId: string | null, toTeamId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onMemberRemove: (userId: string, teamId: string) => Promise<void>;
  onMemberAdd: (userId: string, teamId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  loading?: boolean;
}

interface DraggedMember {
  id: string;
  display_name: string;
  email?: string;
  role: 'ADMIN' | 'MEMBER';
  sourceTeamId: string | null;
  avatar_url?: string;
}

export function DragDropMemberManager({
  teams,
  availableUsers,
  onMemberTransfer,
  onMemberRemove,
  onMemberAdd,
  loading = false,
}: DragDropMemberManagerProps) {
  const [draggedMember, setDraggedMember] = useState<DraggedMember | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'transfer' | 'remove' | 'add';
    member: DraggedMember;
    targetTeamId?: string;
    targetTeamName?: string;
  }>({ open: false, action: 'add', member: {} as DraggedMember });
  const [processingAction, setProcessingAction] = useState(false);

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = useCallback((
    e: React.DragEvent,
    member: TeamMemberWithProfile | typeof availableUsers[0],
    sourceTeamId: string | null
  ) => {
    const getEmail = (member: TeamMemberWithProfile | typeof availableUsers[0]): string | undefined => {
      if ('email' in member) return member.email;
      if ('profiles' in member && member.profiles) return member.profiles.email;
      return undefined;
    };

    const draggedData: DraggedMember = {
      id: member.id,
      display_name: member.display_name,
      email: getEmail(member),
      role: 'role' in member ? (member.role as 'ADMIN' | 'MEMBER') : 'MEMBER',
      sourceTeamId,
      avatar_url: 'avatar_url' in member ? member.avatar_url : undefined,
    };
    
    setDraggedMember(draggedData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, teamId: string) => {
    e.preventDefault();
    setDropTarget(teamId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only clear drop target if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetTeamId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedMember) return;

    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    // Determine the action based on source
    if (draggedMember.sourceTeamId === null) {
      // Adding from available users
      setConfirmDialog({
        open: true,
        action: 'add',
        member: draggedMember,
        targetTeamId,
        targetTeamName: targetTeam.name,
      });
    } else if (draggedMember.sourceTeamId === targetTeamId) {
      // Same team - no action needed
      return;
    } else {
      // Transferring between teams
      setConfirmDialog({
        open: true,
        action: 'transfer',
        member: draggedMember,
        targetTeamId,
        targetTeamName: targetTeam.name,
      });
    }
  }, [draggedMember, teams]);

  const handleRemoveMember = useCallback((member: TeamMemberWithProfile, teamId: string) => {
    setConfirmDialog({
      open: true,
      action: 'remove',
      member: {
        id: member.id,
        display_name: member.display_name,
        email: member.display_name, // Use display_name as fallback since email might not be available
        role: member.role,
        sourceTeamId: teamId,
      },
      targetTeamId: teamId,
      targetTeamName: teams.find(t => t.id === teamId)?.name,
    });
  }, [teams]);

  const executeAction = async () => {
    if (!confirmDialog.member || !confirmDialog.targetTeamId) return;

    setProcessingAction(true);
    try {
      switch (confirmDialog.action) {
        case 'add':
          await onMemberAdd(confirmDialog.member.id, confirmDialog.targetTeamId, selectedRole);
          break;
        case 'transfer':
          await onMemberTransfer(
            confirmDialog.member.id,
            confirmDialog.member.sourceTeamId,
            confirmDialog.targetTeamId,
            confirmDialog.member.role
          );
          break;
        case 'remove':
          await onMemberRemove(confirmDialog.member.id, confirmDialog.targetTeamId);
          break;
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setProcessingAction(false);
      setConfirmDialog({ open: false, action: 'add', member: {} as DraggedMember });
      setDraggedMember(null);
    }
  };

  const MemberCard = ({ member, teamId, isDragging = false }: {
    member: TeamMemberWithProfile | typeof availableUsers[0];
    teamId: string | null;
    isDragging?: boolean;
  }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, member, teamId)}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move transition-all hover:shadow-md",
        isDragging && "opacity-50 scale-95",
        "group"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={'avatar_url' in member ? member.avatar_url : undefined} />
        <AvatarFallback>
          {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{member.display_name}</span>
          {'role' in member && (
            <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
              {member.role === 'ADMIN' ? <Crown className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
              {member.role}
            </Badge>
          )}
        </div>
        {('email' in member ? member.email : undefined) && (
          <p className="text-xs text-gray-500 truncate">
            {'email' in member ? member.email : ''}
          </p>
        )}
      </div>

      {teamId && 'role' in member && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveMember(member as TeamMemberWithProfile, teamId);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const TeamDropZone = ({ team }: { team: EnhancedTeam }) => (
    <Card
      className={cn(
        "transition-all duration-200",
        dropTarget === team.id && "ring-2 ring-blue-500 bg-blue-50",
        "min-h-[200px]"
      )}
      onDragOver={handleDragOver}
      onDragEnter={(e) => handleDragEnter(e, team.id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, team.id)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{team.name}</span>
          </div>
          <Badge variant="outline">
            {team.members?.length || 0} members
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {team.members && team.members.length > 0 ? (
          team.members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              teamId={team.id}
              isDragging={draggedMember?.id === member.id}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Drop members here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Users Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Available Users
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={(value: 'ADMIN' | 'MEMBER') => setSelectedRole(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredAvailableUsers.map((user) => (
              <MemberCard
                key={user.id}
                member={user}
                teamId={null}
                isDragging={draggedMember?.id === user.id}
              />
            ))}
          </div>
          {filteredAvailableUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No available users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <TeamDropZone key={team.id} team={team} />
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'add' && <UserPlus className="h-5 w-5" />}
              {confirmDialog.action === 'transfer' && <ArrowRight className="h-5 w-5" />}
              {confirmDialog.action === 'remove' && <UserMinus className="h-5 w-5" />}
              Confirm {confirmDialog.action === 'add' ? 'Add' : confirmDialog.action === 'transfer' ? 'Transfer' : 'Remove'} Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'add' && (
                <>
                  Add <strong>{confirmDialog.member.display_name}</strong> to team{' '}
                  <strong>{confirmDialog.targetTeamName}</strong> as {selectedRole.toLowerCase()}?
                </>
              )}
              {confirmDialog.action === 'transfer' && (
                <>
                  Transfer <strong>{confirmDialog.member.display_name}</strong> to team{' '}
                  <strong>{confirmDialog.targetTeamName}</strong>?
                </>
              )}
              {confirmDialog.action === 'remove' && (
                <>
                  Remove <strong>{confirmDialog.member.display_name}</strong> from team{' '}
                  <strong>{confirmDialog.targetTeamName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}