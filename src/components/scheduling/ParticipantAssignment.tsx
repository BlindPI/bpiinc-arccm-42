import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, UserMinus, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantAssignmentProps {
  eventId: string;
  eventTitle: string;
  onParticipantsChange?: () => void;
}

export function ParticipantAssignment({ 
  eventId, 
  eventTitle, 
  onParticipantsChange 
}: ParticipantAssignmentProps) {
  const [selectedRosterId, setSelectedRosterId] = useState('');
  const queryClient = useQueryClient();

  // Get available rosters
  const { data: rosters = [] } = useQuery({
    queryKey: ['rosters-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          id, name, description, certificate_count,
          course:course_id (name),
          location:location_id (name)
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get current participants for this event
  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async () => {
      // For now, we'll simulate participants since we need to create the relationship
      // In a real implementation, you'd have a junction table like event_participants
      return [];
    }
  });

  // Assign roster to event
  const assignRoster = useMutation({
    mutationFn: async (rosterId: string) => {
      // This would create entries in an event_participants table
      // For now, we'll update the availability_booking with roster reference
      const { data, error } = await supabase
        .from('availability_bookings')
        .update({ description: `Roster: ${rosterId}` })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Roster assigned to training session');
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onParticipantsChange?.();
      setSelectedRosterId('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign roster: ${error.message}`);
    }
  });

  const handleAssignRoster = () => {
    if (!selectedRosterId) return;
    assignRoster.mutate(selectedRosterId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participant Management
          </CardTitle>
          <CardDescription>
            Assign participants to this training session: {eventTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Roster Assignment */}
          <div className="flex gap-2">
            <Select value={selectedRosterId} onValueChange={setSelectedRosterId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a roster to assign..." />
              </SelectTrigger>
              <SelectContent>
                {rosters.map((roster) => (
                  <SelectItem key={roster.id} value={roster.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{roster.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {roster.certificate_count} participants
                        </Badge>
                        {roster.course && (
                          <Badge variant="secondary" className="text-xs">
                            {roster.course.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAssignRoster}
              disabled={!selectedRosterId || assignRoster.isPending}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Assign Roster
            </Button>
          </div>

          {/* Current Participants */}
          {participants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Current Participants ({participants.length})</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {participant.name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{participant.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {participant.status || 'Enrolled'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No participants assigned yet</p>
              <p className="text-xs">Assign a roster to add participants to this training session</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}