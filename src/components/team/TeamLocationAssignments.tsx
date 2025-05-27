
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService, type TeamLocationAssignment } from '@/services/team/teamManagementService';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Building } from 'lucide-react';
import { toast } from 'sonner';

interface TeamLocationAssignmentsProps {
  teamId: string;
}

export function TeamLocationAssignments({ teamId }: TeamLocationAssignmentsProps) {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'secondary' | 'temporary'>('secondary');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['team-location-assignments', teamId],
    queryFn: () => teamManagementService.getTeamLocationAssignments(teamId)
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

  const assignLocationMutation = useMutation({
    mutationFn: () => teamManagementService.assignTeamToLocation(teamId, selectedLocation, assignmentType),
    onSuccess: () => {
      toast.success('Location assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['team-location-assignments', teamId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setSelectedLocation('');
    },
    onError: (error) => {
      toast.error(`Failed to assign location: ${error.message}`);
    }
  });

  const handleAssignLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }
    assignLocationMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading location assignments...</p>
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
            Assign Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{location.name}</span>
                        {location.city && <span className="text-muted-foreground">• {location.city}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Assignment Type</label>
              <Select value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAssignLocation}
                disabled={!selectedLocation || assignLocationMutation.isPending}
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
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.location_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned: {new Date(assignment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={assignment.assignment_type === 'primary' ? 'default' : 'secondary'}
                    >
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
