
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UniversalTeamCreatorProps {
  userRole: string;
}

export function UniversalTeamCreator({ userRole }: UniversalTeamCreatorProps) {
  const [open, setOpen] = useState(false);
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    team_type: 'general',
    location_id: '',
    provider_id: ''
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'APPROVED')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'SA' || userRole === 'AD'
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!teamData.name.trim()) throw new Error('Team name is required');

      // Determine team type based on user role
      let finalTeamType = teamData.team_type;
      if (userRole === 'AP') finalTeamType = 'provider_team';
      else if (['IC', 'IP', 'IT'].includes(userRole)) finalTeamType = 'instructor_team';

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name.trim(),
          description: teamData.description.trim() || null,
          team_type: finalTeamType,
          location_id: teamData.location_id || null,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          status: 'active',
          performance_score: 0,
          metadata: { created_by_role: userRole },
          current_metrics: {},
          monthly_targets: {},
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'ADMIN',
          permissions: { admin: true, manage_members: true },
          assignment_start_date: new Date().toISOString(),
          team_position: 'Team Creator'
        });

      if (memberError) throw memberError;
      
      return team;
    },
    onSuccess: () => {
      toast.success('Team created successfully!');
      setOpen(false);
      setTeamData({
        name: '',
        description: '',
        team_type: 'general',
        location_id: '',
        provider_id: ''
      });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const getTeamTypeOptions = () => {
    const baseOptions = [
      { value: 'general', label: 'General Team' },
      { value: 'project', label: 'Project Team' },
      { value: 'training', label: 'Training Team' }
    ];

    if (userRole === 'SA' || userRole === 'AD') {
      baseOptions.push(
        { value: 'provider_team', label: 'Provider Team' },
        { value: 'instructor_team', label: 'Instructor Team' },
        { value: 'admin_team', label: 'Admin Team' }
      );
    } else if (userRole === 'AP') {
      baseOptions.push({ value: 'provider_team', label: 'Provider Team' });
    } else if (['IC', 'IP', 'IT'].includes(userRole)) {
      baseOptions.push({ value: 'instructor_team', label: 'Instructor Team' });
    }

    return baseOptions;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
          <DialogDescription>
            Create a new team based on your role and permissions ({userRole}).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); createTeamMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              required
              value={teamData.name}
              onChange={(e) => setTeamData({...teamData, name: e.target.value})}
              placeholder="Enter team name"
              disabled={createTeamMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={teamData.description}
              onChange={(e) => setTeamData({...teamData, description: e.target.value})}
              placeholder="Enter team description (optional)"
              disabled={createTeamMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="team_type">Team Type</Label>
            <Select 
              value={teamData.team_type} 
              onValueChange={(value) => setTeamData({...teamData, team_type: value})}
              disabled={createTeamMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                {getTeamTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {locations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Select 
                value={teamData.location_id} 
                onValueChange={(value) => setTeamData({...teamData, location_id: value})}
                disabled={createTeamMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {providers.length > 0 && (userRole === 'SA' || userRole === 'AD') && (
            <div className="space-y-2">
              <Label htmlFor="provider">Provider (Optional)</Label>
              <Select 
                value={teamData.provider_id} 
                onValueChange={(value) => setTeamData({...teamData, provider_id: value})}
                disabled={createTeamMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No provider</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={createTeamMutation.isPending || !teamData.name.trim()} 
            className="w-full"
          >
            {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
