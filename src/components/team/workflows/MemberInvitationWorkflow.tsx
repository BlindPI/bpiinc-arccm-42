
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { WorkflowService } from '@/services/team/workflowService';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, User, Clock, CheckCircle, XCircle } from 'lucide-react';
// Removed import of deleted utility
import { WorkflowInstanceRow } from '@/types/supabase-helpers';

interface MemberInvitationWorkflowProps {
  teamId: string;
}

export function MemberInvitationWorkflow({ teamId }: MemberInvitationWorkflowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [invitationMessage, setInvitationMessage] = useState('');

  // Get pending invitations - simplified without deleted utility
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      // Simplified workflow query
      return [];
    }
  });

  const inviteMembersMutation = useMutation({
    mutationFn: async ({ emailList, role }: { emailList: string[]; role: 'MEMBER' | 'ADMIN' }) => {
      const workflowData = {
        team_id: teamId,
        invited_emails: emailList,
        role: role,
        invitation_message: invitationMessage,
        invited_by: user?.id
      };

      return WorkflowService.initiateWorkflow(
        'member_invitation',
        'team_member_invitation',
        teamId,
        user?.id!,
        workflowData
      );
    },
    onSuccess: () => {
      toast.success('Member invitation workflow initiated');
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      setEmails('');
      setInvitationMessage('');
    },
    onError: (error: any) => {
      toast.error('Failed to initiate invitation: ' + error.message);
    }
  });

  const handleInviteMembers = () => {
    const emailList = emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailList.length === 0) {
      toast.error('Please provide valid email addresses');
      return;
    }

    inviteMembersMutation.mutate({
      emailList,
      role: selectedRole
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Invite Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses (one per line)</Label>
            <Textarea
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              {emails.split('\n').filter(line => line.trim() && line.includes('@')).length} valid email addresses
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Member Role</Label>
            <Select value={selectedRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Team Member</SelectItem>
                <SelectItem value="ADMIN">Team Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Invitation Message (Optional)</Label>
            <Textarea
              id="message"
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              placeholder="Welcome to our team! We're excited to have you join us."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleInviteMembers}
            disabled={inviteMembersMutation.isPending || !emails.trim()}
            className="w-full"
          >
            {inviteMembersMutation.isPending ? 'Processing...' : 'Send Invitations'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(invitation.status)}
                    <div>
                      <p className="font-medium">Team Member Invitation</p>
                      <p className="text-sm text-muted-foreground">
                        Initiated {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    invitation.status === 'completed' ? 'default' :
                    invitation.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {invitation.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending invitations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
