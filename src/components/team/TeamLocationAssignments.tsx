
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamManagementService } from '@/services/team/teamManagementService';
import type { TeamLocationAssignment } from '@/types/team-management';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Plus, Calendar, Building2 } from 'lucide-react';

interface TeamLocationAssignmentsProps {
  teamId: string;
}

export function TeamLocationAssignments({ teamId }: TeamLocationAssignmentsProps) {
  const queryClient = useQueryClient();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'secondary' | 'coverage'>('primary');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['team-location-assignments', teamId],
    queryFn: () => TeamManagementService.getTeamLocationAssignments(teamId)
  });

  const { data: availableLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const assignLocationMutation = useMutation({
    mutationFn: ({ locationId, type }: { locationId: string; type: 'primary' | 'secondary' | 'coverage' }) =>
      TeamManagementService.assignTeamToLocation(teamId, locationId, type),
    onSuccess: () => {
      toast.success('Location assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['team-location-assignments', teamId] });
      setSelectedLocationId('');
    },
    onError: (error: any) => {
      console.error('Error assigning location:', error);
      toast.error('Failed to assign location');
    }
  });

  const handleAssignLocation = () => {
    if (!selectedLocationId) {
      toast.error('Please select a location');
      return;
    }
    
    assignLocationMutation.mutate({ 
      locationId: selectedLocationId, 
      type: assignmentType 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Assign New Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Assignment Type</label>
              <Select value={assignmentType} onValueChange={(value: 'primary' | 'secondary' | 'coverage') => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="coverage">Coverage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAssignLocation}
                disabled={assignLocationMutation.isPending || !selectedLocationId}
                className="w-full"
              >
                {assignLocationMutation.isPending ? 'Assigning...' : 'Assign Location'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assignment.location_name || 'Unknown Location'}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Since {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={assignment.assignment_type === 'primary' ? 'default' : 'secondary'}>
                      {assignment.assignment_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No location assignments found</p>
              <p className="text-sm">Assign this team to locations to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
