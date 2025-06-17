import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apUserService, type APUser } from '@/services/provider/apUserService';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  Building, 
  Briefcase,
  MapPin
} from 'lucide-react';

export interface APUserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderCreated?: () => void;
}

export function APUserSelectionDialog({ open, onOpenChange, onProviderCreated }: APUserSelectionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAPUserId, setSelectedAPUserId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // Fetch AP users
  const { data: apUsers = [], isLoading: loadingAPUsers } = useQuery({
    queryKey: ['ap-users'],
    queryFn: () => apUserService.getAPUsers(),
    enabled: open
  });

  // Fetch locations
  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const assignAPUserMutation = useMutation({
    mutationFn: async ({ apUserId, locationId }: { apUserId: string; locationId: string }) => {
      return await apUserService.assignAPUserToLocation(apUserId, locationId, 'provider');
    },
    onSuccess: () => {
      toast.success('AP User assigned as Authorized Provider successfully!');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      onProviderCreated?.();
      onOpenChange(false);
      setSelectedAPUserId('');
      setSelectedLocationId('');
    },
    onError: (error: any) => {
      console.error('Error assigning AP user:', error);
      toast.error('Failed to assign AP user as provider');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAPUserId) {
      toast.error('Please select an AP user');
      return;
    }
    if (!selectedLocationId) {
      toast.error('Please select a location');
      return;
    }
    assignAPUserMutation.mutate({ 
      apUserId: selectedAPUserId, 
      locationId: selectedLocationId 
    });
  };

  const selectedAPUser = apUsers.find(user => user.id === selectedAPUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign AP User as Authorized Provider
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Primary Location</Label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                disabled={loadingLocations}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location.name}
                        {location.city && ` - ${location.city}, ${location.state}`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apUser">AP User to Authorize</Label>
              <Select
                value={selectedAPUserId}
                onValueChange={setSelectedAPUserId}
                disabled={loadingAPUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an AP user" />
                </SelectTrigger>
                <SelectContent>
                  {apUsers.map((apUser) => (
                    <SelectItem key={apUser.id} value={apUser.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{apUser.display_name}</span>
                        <span className="text-xs text-muted-foreground">{apUser.email}</span>
                        {apUser.organization && (
                          <span className="text-xs text-muted-foreground">{apUser.organization}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {apUsers.length === 0 && !loadingAPUsers && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  No AP users found. Users must be assigned the AP role before they can be authorized as providers.
                </div>
              )}
            </div>

            {selectedAPUser && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{selectedAPUser.display_name}</h4>
                      <Badge variant="secondary" className="mt-1">
                        {selectedAPUser.role} - Authorized Provider
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAPUser.email}</span>
                    </div>
                    
                    {selectedAPUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedAPUser.phone}</span>
                      </div>
                    )}
                    
                    {selectedAPUser.organization && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedAPUser.organization}</span>
                      </div>
                    )}
                    
                    {selectedAPUser.job_title && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedAPUser.job_title}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignAPUserMutation.isPending || !selectedAPUserId || !selectedLocationId}
              className="flex-1"
            >
              {assignAPUserMutation.isPending ? 'Assigning...' : 'Assign as Provider'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}