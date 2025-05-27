
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { Building2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderTeamAssignmentsProps {
  teamId: string;
}

export function ProviderTeamAssignments({ teamId }: ProviderTeamAssignmentsProps) {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [assignmentRole, setAssignmentRole] = useState<string>('member');
  const [oversightLevel, setOversightLevel] = useState<'none' | 'monitor' | 'manage' | 'admin'>('none');

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders()
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['provider-team-assignments', teamId],
    queryFn: async () => {
      // Get assignments for all providers and filter by team
      const allProviders = await authorizedProviderService.getAllProviders();
      const allAssignments = [];
      
      for (const provider of allProviders) {
        const providerAssignments = await authorizedProviderService.getProviderTeamAssignments(provider.id);
        const teamAssignments = providerAssignments.filter(a => a.team_id === teamId);
        allAssignments.push(...teamAssignments);
      }
      
      return allAssignments;
    }
  });

  const assignProviderMutation = useMutation({
    mutationFn: () => authorizedProviderService.assignProviderToTeam({
      provider_id: selectedProvider,
      team_id: teamId,
      assignment_role: assignmentRole,
      oversight_level: oversightLevel
    }),
    onSuccess: () => {
      toast.success('Provider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', teamId] });
      setSelectedProvider('');
    },
    onError: (error) => {
      toast.error(`Failed to assign provider: ${error.message}`);
    }
  });

  const handleAssignProvider = () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }
    assignProviderMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading provider assignments...</p>
      </div>
    );
  }

  const approvedProviders = providers.filter(p => p.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* Add New Assignment */}
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
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
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
                onClick={handleAssignProvider}
                disabled={!selectedProvider || assignProviderMutation.isPending}
                className="w-full"
              >
                {assignProviderMutation.isPending ? 'Assigning...' : 'Assign Provider'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Assigned Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.team_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {assignment.assignment_role} • 
                        Oversight: {assignment.oversight_level} •
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                    <Badge variant="outline">
                      {assignment.oversight_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No provider assignments found</p>
              <p className="text-sm">Assign authorized providers to this team to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
