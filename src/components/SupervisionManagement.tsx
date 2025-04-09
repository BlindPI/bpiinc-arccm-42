
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { ActiveSupervisionRelationship, ActiveSupervisor } from "@/types/supabase-views";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SupervisionManagement() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch available active supervisors
  const { data: activeSupervisors, isLoading: supervisorsLoading } = useQuery({
    queryKey: ['active-supervisors'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('active_supervisors')
        .select('*');
      
      if (error) throw error;
      return data as ActiveSupervisor[];
    },
    enabled: !!user && !!profile
  });

  // Fetch current supervision relationships
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['supervision-relationships'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('active_supervision_relationships')
        .select('*');
      
      if (error) throw error;
      return data as ActiveSupervisionRelationship[];
    },
    enabled: !!user && !!profile
  });

  // Filter relationships based on the current user's role
  const mySupervisors = relationships?.filter(r => r.supervisee_id === user?.id) || [];
  const mySuperviseesRequests = relationships?.filter(r => 
    r.supervisor_id === user?.id && r.status === 'REQUESTED'
  ) || [];
  
  // Mutation for requesting a supervisor
  const { mutate: requestSupervisor, isPending: isRequesting } = useMutation({
    mutationFn: async (supervisorId: string) => {
      if (!user) throw new Error('You must be logged in to request a supervisor');
      
      const { error } = await supabase
        .from('supervision_relationships')
        .insert({
          supervisor_id: supervisorId,
          supervisee_id: user.id,
          status: 'REQUESTED'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Supervision request sent successfully');
      setSelectedSupervisor("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send request: ${error.message}`);
    }
  });

  // Mutation for responding to supervision requests
  const { mutate: respondToRequest, isPending: isResponding } = useMutation({
    mutationFn: async ({ 
      relationshipId, 
      accept 
    }: { 
      relationshipId: string; 
      accept: boolean 
    }) => {
      const { error } = await supabase
        .from('supervision_relationships')
        .update({ 
          status: accept ? 'ACTIVE' : 'REJECTED' 
        })
        .eq('id', relationshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Response submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to respond: ${error.message}`);
    }
  });

  const handleRequestSupervisor = () => {
    if (!selectedSupervisor) {
      toast.error('Please select a supervisor');
      return;
    }
    
    requestSupervisor(selectedSupervisor);
  };

  const handleRespondToRequest = (relationshipId: string, accept: boolean) => {
    respondToRequest({ relationshipId, accept });
  };

  const alreadyHasSupervisor = mySupervisors.some(
    r => r.status === 'ACTIVE' || r.status === 'REQUESTED'
  );

  const availableSupervisors = activeSupervisors?.filter(supervisor => 
    // Don't show supervisors that the user already has a relationship with
    !mySupervisors.some(r => r.supervisor_id === supervisor.supervisor_id) &&
    // Don't show the user as their own supervisor
    supervisor.supervisor_id !== user?.id
  ) || [];

  const isLoading = supervisorsLoading || relationshipsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Supervision Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Supervisors */}
        {mySupervisors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Supervisors</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySupervisors.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>{relationship.supervisor_name}</TableCell>
                    <TableCell>{relationship.supervisor_role}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={relationship.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {relationship.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Request a Supervisor Section */}
        {!alreadyHasSupervisor && availableSupervisors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Request a Supervisor</h3>
            <div className="flex gap-2">
              <Select
                value={selectedSupervisor}
                onValueChange={setSelectedSupervisor}
                disabled={isRequesting}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {availableSupervisors.map((supervisor) => (
                    <SelectItem key={supervisor.supervisor_id} value={supervisor.supervisor_id}>
                      {supervisor.supervisor_name} ({supervisor.supervisor_role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleRequestSupervisor} 
                disabled={!selectedSupervisor || isRequesting}
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Request Supervisor'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Supervision Requests */}
        {mySuperviseesRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supervision Requests</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySuperviseesRequests.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>{relationship.supervisee_name}</TableCell>
                    <TableCell>{relationship.supervisee_role}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRespondToRequest(relationship.id, true)}
                          disabled={isResponding}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespondToRequest(relationship.id, false)}
                          disabled={isResponding}
                        >
                          Decline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Empty state */}
        {mySupervisors.length === 0 && 
         mySuperviseesRequests.length === 0 && 
         availableSupervisors.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No supervision relationships available at this time.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
