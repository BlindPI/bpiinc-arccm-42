/**
 * TEAM MEMBER MANAGEMENT - PROVIDER INTERFACE
 *
 * ✅ Full member management functionality with real database integration
 * ✅ Add/remove team members
 * ✅ Role assignment and management
 * ✅ Member performance tracking
 * ✅ Real-time updates
 * ✅ FIXED: Safe email access for AP users with null emails
 */

import React, { useState } from 'react';
import {
  getSafeUserEmail,
  getSafeUserPhone,
  getSafeDisplayEmail,
  getSafeDisplayPhone,
  getSafeUserDisplayName,
  hasValidEmail,
  hasValidPhone,
  makeSafeTeamMember,
  safeProfileSearchFilter
} from '@/utils/fixNullProfileAccessPatterns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { diagnoseAPTeamMemberAccess, logAPTeamMemberDiagnostics } from '@/utils/diagnoseAPTeamMemberAccess';
import { diagnoseAPTeamRelationshipDeep } from '@/utils/diagnoseAPTeamRelationshipDeep';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserPlus,
  UserMinus,
  Edit2,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMemberManagementProps {
  teamId: string;
  onBack: () => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  performance_score?: number;
  user: {
    id: string;
    email: string | null;
    display_name?: string | null;
    phone?: string | null;
    organization?: string | null;
    role: string;
    status: string;
  } | null;
}

interface AvailableUser {
  id: string;
  email: string | null;
  display_name?: string | null;
  phone?: string | null;
  organization?: string | null;
  role: string;
  status: string;
}

const MEMBER_ROLES = [
  { value: 'member', label: 'Team Member' },
  { value: 'lead', label: 'Team Lead' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'coordinator', label: 'Coordinator' }
];

export function TeamMemberManagement({ teamId, onBack }: TeamMemberManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [accessDiagnostics, setAccessDiagnostics] = useState<any>(null);

  // Load team details
  const { data: team } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Load team members with enhanced data loading and diagnostics
  const { data: teamMembers = [], isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      console.log('🔍 Loading team members for team:', teamId);
      
      // 🚨 RUN AP TEAM MEMBER ACCESS DIAGNOSTICS
      try {
        const diagnostics = await diagnoseAPTeamMemberAccess(user?.id);
        setAccessDiagnostics(await logAPTeamMemberDiagnostics(diagnostics));
        
        console.log('📊 AP TEAM MEMBER ACCESS DIAGNOSTIC COMPLETE');
        
        // Check for critical RLS issues
        const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
        if (criticalIssues.length > 0) {
          console.error('🚨 CRITICAL TEAM MEMBER ACCESS ISSUES:', criticalIssues.map(i => i.issue_type));
          
          // Run deep diagnostic for detailed analysis
          console.log('🔍 RUNNING DEEP DIAGNOSTIC FOR ROOT CAUSE ANALYSIS...');
          await diagnoseAPTeamRelationshipDeep(user?.id, teamId);
        }
      } catch (diagnosticError) {
        console.error('❌ Team member access diagnostic failed:', diagnosticError);
      }
      
      // Try multiple query strategies to get the data
      let finalData: TeamMember[] = [];
      
      // Strategy 1: Try direct join
      try {
        const { data: joinData, error: joinError } = await supabase
          .from('team_members')
          .select(`
            *,
            user:profiles(
              id,
              email,
              display_name,
              phone,
              organization,
              role,
              status
            )
          `)
          .eq('team_id', teamId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (!joinError && joinData && joinData.length > 0) {
          console.log('✅ Direct join successful:', joinData.length, 'members');
          console.log('📋 Sample member data:', joinData[0]);
          finalData = joinData;
        } else {
          console.log('⚠️ Direct join failed or empty:', joinError?.message);
          throw new Error('Direct join failed, trying manual approach');
        }
      } catch (joinError) {
        console.log('🔄 Direct join failed, trying manual approach...');
        
        // Strategy 2: Manual join - get team members first, then profiles
        const { data: members, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (memberError) {
          console.error('❌ Failed to load team members:', memberError);
          throw memberError;
        }
        
        if (!members || members.length === 0) {
          console.log('ℹ️ No team members found');
          return [];
        }
        
        console.log('✅ Found team members:', members.length);
        
        // Get user IDs and fetch profiles
        const userIds = members.map(m => m.user_id).filter(Boolean);
        console.log('👥 User IDs to fetch:', userIds);
        
        if (userIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, display_name, phone, organization, role, status')
            .in('id', userIds);
          
          if (profileError) {
            console.error('❌ Failed to load profiles:', profileError);
            // Continue with null profiles rather than failing completely
          }
          
          console.log('👤 Loaded profiles:', profiles?.length || 0);
          console.log('📋 Sample profile:', profiles?.[0]);
          
          // Combine members with their profiles
          finalData = members.map(member => ({
            ...member,
            user: profiles?.find(p => p.id === member.user_id) || null
          }));
        } else {
          finalData = members.map(member => ({ ...member, user: null }));
        }
      }
      
      console.log('📊 Final team members data:', finalData.length, 'members');
      if (finalData.length > 0) {
        console.log('📋 Sample final member:', {
          id: finalData[0].id,
          user_id: finalData[0].user_id,
          user: finalData[0].user,
          hasUser: !!finalData[0].user,
          userEmail: finalData[0].user?.email,
          userDisplayName: finalData[0].user?.display_name
        });
      }
      
      return finalData;
    }
  });

  // Load available users for adding
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available-users', teamId],
    queryFn: async (): Promise<AvailableUser[]> => {
      // Get users who are not already in this team
      const currentMemberIds = teamMembers.map(m => m.user_id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, phone, organization, role, status')
        .in('role', ['IC', 'IP', 'IT', 'IN']) // Instructor roles
        .eq('status', 'active')
        .not('id', 'in', `(${currentMemberIds.join(',')})`)
        .order('email');
      
      if (error) throw error;
      return data || [];
    },
    enabled: showAddDialog && teamMembers.length > 0
  });

  // Add members mutation using safe function
  const addMembersMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      console.log('🔄 Adding team members using safe function:', { userIds, role });
      
      // Use the safe function for each user
      const results = await Promise.all(
        userIds.map(async (userId) => {
          const { data, error } = await supabase.rpc('add_team_member_safe', {
            p_team_id: teamId,
            p_user_id: userId,
            p_role: role
          });
          
          if (error) {
            console.error('❌ Failed to add team member:', { userId, error });
            throw error;
          }
          
          return data;
        })
      );
      
      console.log('✅ Team members added successfully:', results);
    },
    onSuccess: () => {
      toast.success('Members added successfully!');
      setShowAddDialog(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to add members: ${error.message}`);
    }
  });

  // Remove member mutation using safe function
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('🔄 Removing team member using safe function:', memberId);
      
      const { data, error } = await supabase.rpc('remove_team_member_safe' as any, {
        p_member_id: memberId
      });
      
      if (error) {
        console.error('❌ Failed to remove team member:', error);
        throw error;
      }
      
      console.log('✅ Team member removed successfully');
    },
    onSuccess: () => {
      toast.success('Member removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  // Update role mutation using safe function
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      console.log('🔄 Updating team member role using safe function:', { memberId, role });
      
      const { error } = await supabase.rpc('update_team_member_role_safe' as any, {
        p_member_id: memberId,
        p_new_role: role
      });
      
      if (error) {
        console.error('❌ Team member role update failed:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('Insufficient permissions')) {
          throw new Error('You do not have permission to change roles for this team member.');
        } else if (error.message.includes('Invalid role')) {
          throw new Error('The selected role is not valid for team members.');
        } else {
          throw new Error(`Failed to update member role: ${error.message}`);
        }
      }
      
      console.log('✅ Team member role updated successfully using safe function');
    },
    onSuccess: () => {
      toast.success('Member role updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    await addMembersMutation.mutateAsync({
      userIds: selectedUsers,
      role: selectedRole
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      await removeMemberMutation.mutateAsync(memberId);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    await updateRoleMutation.mutateAsync({ memberId, role: newRole });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredMembers = teamMembers.filter(member => {
    return safeProfileSearchFilter(member.user, searchTerm, ['email', 'display_name', 'phone', 'organization']);
  });

  const getFullName = (user: any) => {
    return getSafeUserDisplayName(user);
  };

  // Process members with safe access patterns
  const safeTeamMembers = teamMembers.map(makeSafeTeamMember);
  const safeFilteredMembers = filteredMembers.map(makeSafeTeamMember);

  return (
    <div className="space-y-6">
      {/* AP Team Member Access Alerts */}
      {accessDiagnostics && accessDiagnostics.critical > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-medium">🚨 Team Member Access Issues</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => diagnoseAPTeamRelationshipDeep(user?.id, teamId)}
              className="text-red-600 border-red-300"
            >
              Run Deep Diagnostic
            </Button>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {accessDiagnostics.critical} critical issues detected with AP user team member access.
            This explains the 400 errors when trying to change team member positions.
          </p>
          <p className="text-red-600 text-xs mt-2">
            Check console for detailed diagnostic results. Click "Run Deep Diagnostic" for root cause analysis.
          </p>
        </div>
      )}

      {accessDiagnostics && accessDiagnostics.high > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-medium">⚠️ Team Structure Issues</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            {accessDiagnostics.high} high-priority issues found. Team makeup changes may not work properly
            due to role permissions and team structure problems.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-muted-foreground">
            {team?.name} • {teamMembers.length} members
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground mt-1">
                Debug: {teamMembers.length} raw members, {safeFilteredMembers.length} safe members
                {accessDiagnostics && (
                  <span className="ml-2 text-red-600">
                    | Access Issues: {accessDiagnostics.total}
                  </span>
                )}
              </div>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Members
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back to Team
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Members Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{teamMembers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Team Leads</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.filter(m => m.role === 'lead').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Performance</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.length > 0
                ? Math.round(teamMembers.reduce((sum, m) => sum + (m.performance_score || 0), 0) / teamMembers.length)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.filter(m => m.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              Loading members...
            </div>
          ) : membersError ? (
            <div className="text-center py-8 text-red-600">
              <p className="font-medium">Error loading team members:</p>
              <p className="text-sm mt-2">{(membersError as Error).message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : safeFilteredMembers.length > 0 ? (
            <div className="space-y-4">
              {safeFilteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{getFullName(member.user)}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {hasValidEmail(member.user) && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {getSafeUserEmail(member.user)}
                          </span>
                        )}
                        {hasValidPhone(member.user) && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {getSafeUserPhone(member.user)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {member.role}
                        </Badge>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        {member.performance_score !== undefined && (
                          <Badge variant="outline">
                            {member.performance_score}% performance
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                      disabled={accessDiagnostics && accessDiagnostics.critical > 0}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {accessDiagnostics && accessDiagnostics.critical > 0 && (
                      <span className="text-xs text-red-600">
                        Role changes disabled due to access restrictions
                      </span>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Members Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Select users to add to {team?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Member Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Available Users</Label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {availableUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                    <div>
                      <div className="font-medium">{getFullName(user)}</div>
                      <div className="text-sm text-muted-foreground">{getSafeDisplayEmail(user)}</div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {selectedUsers.length} users
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMembers}
                disabled={addMembersMutation.isPending || selectedUsers.length === 0}
              >
                {addMembersMutation.isPending ? 'Adding...' : 'Add Members'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}