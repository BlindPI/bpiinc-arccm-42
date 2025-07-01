
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck, UserPlus, UserMinus } from "lucide-react";
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
      return data as unknown as ActiveSupervisor[];
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
      return data as unknown as ActiveSupervisionRelationship[];
    },
    enabled: !!user && !!profile
  });

  const mySupervisors = relationships?.filter(r => r.supervisee_id === user?.id) || [];
  const mySuperviseesRequests = relationships?.filter(r => 
    r.supervisor_id === user?.id && r.status === 'REQUESTED'
  ) || [];
  
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
    !mySupervisors.some(r => r.supervisor_id === supervisor.supervisor_id) &&
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
    <Card className="animate-fade-in shadow-lg border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-500" />
          <span>Supervision Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mySupervisors.length > 0 && (
          <div className="space-y-4 bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
              <UserPlus className="h-4 w-4" />
              My Supervisors
            </h3>
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
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{relationship.supervisor_role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={relationship.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={relationship.status === 'ACTIVE' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
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

        {/* Request a Supervisor */}
        {!alreadyHasSupervisor && availableSupervisors.length > 0 && (
          <div className="space-y-4 bg-blue-50 p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
              <UserPlus className="h-4 w-4" />
              Request a Supervisor
            </h3>
            <div className="flex gap-2 flex-col md:flex-row md:items-center">
              <Select
                value={selectedSupervisor}
                onValueChange={setSelectedSupervisor}
                disabled={isRequesting}
              >
                <SelectTrigger className="w-full md:w-[260px]">
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
                className="bg-blue-500 text-white shadow hover:bg-blue-600 mt-2 md:mt-0"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    Request Supervisor
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Supervision Requests */}
        {mySuperviseesRequests.length > 0 && (
          <div className="space-y-4 bg-purple-50 p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-700">
              <UserMinus className="h-4 w-4" />
              Supervision Requests
            </h3>
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
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{relationship.supervisee_role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-500 text-white shadow-sm"
                          onClick={() => handleRespondToRequest(relationship.id, true)}
                          disabled={isResponding}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600"
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
