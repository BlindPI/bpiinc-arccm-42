
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unifiedApUserService } from '@/services/provider/unifiedApUserService';
import { Building2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProviderTeamAssignmentsProps {
  teamId: string;
}

export function ProviderTeamAssignments({ teamId }: ProviderTeamAssignmentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedApUser, setSelectedApUser] = useState<string>('');
  const [assignmentRole, setAssignmentRole] = useState<string>('support');
  const [oversightLevel, setOversightLevel] = useState<'none' | 'monitor' | 'manage' | 'admin'>('monitor');

  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['provider-team-assignments', teamId],
    queryFn: async () => {
      // This would normally fetch from the database
      // For now, return empty array until the table structure is finalized
      return [];
    }
  });

  const assignProviderMutation = useMutation({
    mutationFn: () => authorizedProviderService.assignProviderToTeam(
      selectedProvider,
      teamId,
      assignmentRole,
      oversightLevel
    ),
    onSuccess: () => {
      toast.success('Provider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', teamId] });
      setSelectedProvider('');
    },
    onError: (error) => {
      toast.error(`Failed to assign provider: ${error.message}`);
    }
  });

  const handleAssignApUser = () => {
    if (!selectedApUser) {
      toast.error('Please select an AP user');
      return;
    }
    assignApUserMutation.mutate();
  };

  const activeApUsers = apUsers.filter(ap => ap.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Add New Provider Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Assign Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{provider.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={assignmentRole} onValueChange={setAssignmentRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="oversight">Oversight</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Oversight Level</label>
              <Select value={oversightLevel} onValueChange={(value: any) => setOversightLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="manage">Manage</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleAssignApUser}
                disabled={!selectedApUser || assignApUserMutation.isPending}
                className="w-full"
              >
                {assignApUserMutation.isPending ? 'Assigning...' : 'Assign AP User'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current AP User Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            AP User Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.provider_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {assignment.assignment_role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {assignment.oversight_level}
                    </Badge>
                    <Badge 
                      variant={assignment.status === 'active' ? 'default' : 'secondary'}
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No provider assignments found</p>
              <p className="text-sm">Assign providers to this team to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
