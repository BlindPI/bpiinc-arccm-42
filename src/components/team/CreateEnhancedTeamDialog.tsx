
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateEnhancedTeamDialogProps {
  onTeamCreated: () => void;
}

export function CreateEnhancedTeamDialog({ onTeamCreated }: CreateEnhancedTeamDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_id: 'no-location',
    provider_id: 'no-provider',
    team_type: 'operational'
  });

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
    queryFn: () => authorizedProviderService.getAllProviders(),
    retry: 1
  });

  // Get user's authorized provider if they have AP role
  const { data: userProvider } = useQuery({
    queryKey: ['user-provider', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'AP') {
        const { data: provider } = await supabase
          .from('authorized_providers')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'APPROVED')
          .single();
        
        return provider;
      }
      
      return null;
    },
    enabled: !!user?.id
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('You must be logged in to create a team');
      }

      // Convert special values to undefined for optional fields
      const cleanedData = {
        ...formData,
        location_id: formData.location_id === 'no-location' ? undefined : formData.location_id,
        provider_id: formData.provider_id === 'no-provider' ? undefined : formData.provider_id
      };

      return teamManagementService.createTeamWithLocation(cleanedData);
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      setIsOpen(false);
      setError(null);
      setFormData({
        name: '',
        description: '',
        location_id: 'no-location',
        provider_id: 'no-provider',
        team_type: 'operational'
      });
      onTeamCreated();
    },
    onError: (error: any) => {
      console.error('Team creation error:', error);
      let errorMessage = 'Failed to create team';
      
      if (error.message?.includes('violates row-level security')) {
        errorMessage = 'Permission denied. Please ensure you have the required permissions to create teams.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Please log in to create a team.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    
    createTeamMutation.mutate();
  };

  // Pre-select user's provider if they have AP role
  React.useEffect(() => {
    if (userProvider && !formData.provider_id) {
      setFormData(prev => ({
        ...prev,
        provider_id: userProvider.id.toString()
      }));
    }
  }, [userProvider, formData.provider_id]);

  const approvedProviders = providers.filter(p => p.status === 'APPROVED');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Enhanced Team</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter team description..."
            />
          </div>

          <div>
            <Label htmlFor="team_type">Team Type</Label>
            <Select value={formData.team_type} onValueChange={(value) => setFormData({ ...formData, team_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location_id">Primary Location</Label>
            <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-location">No location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} {location.city && `• ${location.city}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider_id">Authorized Provider</Label>
            <Select value={formData.provider_id} onValueChange={(value) => setFormData({ ...formData, provider_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-provider">No provider</SelectItem>
                {approvedProviders.length > 0 ? (
                  approvedProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-providers-available" disabled>
                    No approved providers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {approvedProviders.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No authorized providers found. Contact an administrator to create provider records.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeamMutation.isPending}>
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
