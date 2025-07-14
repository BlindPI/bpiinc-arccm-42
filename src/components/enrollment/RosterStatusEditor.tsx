import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, Archive, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentRoster {
  id: string;
  roster_name: string;
  roster_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  current_enrollment: number;
  max_capacity: number;
}

interface RosterStatusEditorProps {
  roster: StudentRoster;
  onStatusUpdate: () => void;
}

export function RosterStatusEditor({ roster, onStatusUpdate }: RosterStatusEditorProps) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('student_rosters')
        .update({ roster_status: newStatus })
        .eq('id', roster.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      onStatusUpdate();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update roster: ${error.message}`);
    }
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'DRAFT': return 'outline';
      case 'ARCHIVED': return 'secondary';
      default: return 'outline';
    }
  };

  const getActionButtons = () => {
    switch (roster.roster_status) {
      case 'DRAFT':
        return (
          <Button 
            onClick={() => updateStatus.mutate('ACTIVE')}
            disabled={updateStatus.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Activate Roster
          </Button>
        );
      
      case 'ACTIVE':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => updateStatus.mutate('COMPLETED')}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Completed
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateStatus.mutate('ARCHIVED')}
              disabled={updateStatus.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </div>
        );
      
      case 'COMPLETED':
        return (
          <Button 
            variant="outline"
            onClick={() => updateStatus.mutate('ARCHIVED')}
            disabled={updateStatus.isPending}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        );
      
      case 'ARCHIVED':
        return (
          <Button 
            variant="outline"
            onClick={() => updateStatus.mutate('ACTIVE')}
            disabled={updateStatus.isPending}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reactivate
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roster Status Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Status</Label>
          <Badge variant={getStatusVariant(roster.roster_status)} className="text-sm">
            {roster.roster_status}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Label>Enrollment</Label>
          <p className="text-sm text-muted-foreground">
            {roster.current_enrollment} of {roster.max_capacity} students enrolled
          </p>
        </div>

        <div className="pt-4">
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
}