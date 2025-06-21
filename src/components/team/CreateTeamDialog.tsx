/**
 * WORKING Create Team Dialog
 * Actually creates teams using CleanAPTeamService
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CleanAPTeamService } from '@/services/clean/CleanAPTeamService';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function CreateTeamDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationId: '',
    apUserId: user?.id || ''
  });

  // Get locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-for-team'],
    queryFn: () => CleanAPTeamService.getAvailableLocations()
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: () => CleanAPTeamService.createTeamWithAPUser({
      name: formData.name,
      description: formData.description,
      locationId: formData.locationId,
      apUserId: formData.apUserId
    }),
    onSuccess: () => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['clean-user-teams'] });
      queryClient.invalidateQueries({ queryKey: ['clean-ap-dashboard'] });
      setFormData({ name: '', description: '', locationId: '', apUserId: user?.id || '' });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    if (!formData.locationId) {
      toast.error('Please select a location');
      return;
    }
    
    createTeamMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
