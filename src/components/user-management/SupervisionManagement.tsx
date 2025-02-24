
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus2, Users2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";

export const SupervisionManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedSupervisee, setSelectedSupervisee] = useState<string>("");
  const queryClient = useQueryClient();
  const { data: currentUserProfile } = useProfile();

  // Fetch active supervision relationships
  const { data: relationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['supervision-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_supervision_relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch potential supervisors (AP role and above)
  const { data: supervisors, isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['potential-supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['AP', 'AD'])
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });

  // Get the selected supervisor's role
  const selectedSupervisorRole = supervisors?.find(
    supervisor => supervisor.id === selectedSupervisor
  )?.role;

  // Fetch potential supervisees based on the selected supervisor's role
  const { data: supervisees, isLoading: isLoadingSupervisees } = useQuery({
    queryKey: ['potential-supervisees', selectedSupervisorRole],
    enabled: !!selectedSupervisorRole,
    queryFn: async () => {
      const allowedRoles = selectedSupervisorRole === 'AD' 
        ? ['AP']  // AD can only supervise AP
        : ['IT', 'IP', 'IC'];  // AP can supervise IT, IP, and IC

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', allowedRoles)
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });

  // Mutation to create new supervision relationship
  const createRelationship = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('supervision_relationships')
        .insert([
          {
            supervisor_id: selectedSupervisor,
            supervisee_id: selectedSupervisee,
            status: 'ACTIVE'
          }
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Supervision relationship created successfully');
      setIsAddOpen(false);
      setSelectedSupervisor("");
      setSelectedSupervisee("");
    },
    onError: (error) => {
      toast.error('Failed to create supervision relationship');
      console.error('Error creating relationship:', error);
    },
  });

  // Mutation to end supervision relationship
  const endRelationship = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from('supervision_relationships')
        .update({ status: 'INACTIVE' })
        .eq('id', relationshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Supervision relationship ended successfully');
    },
    onError: (error) => {
      toast.error('Failed to end supervision relationship');
      console.error('Error ending relationship:', error);
    },
  });

  const handleCreateRelationship = () => {
    if (!selectedSupervisor || !selectedSupervisee) {
      toast.error('Please select both supervisor and supervisee');
      return;
    }
    createRelationship.mutate();
  };

  if (isLoadingRelationships || isLoadingSupervisors || isLoadingSupervisees) {
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users2 className="h-5 w-5" />
          Supervision Relationships
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus2 className="mr-2 h-4 w-4" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Supervision Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisor</label>
                <Select
                  value={selectedSupervisor}
                  onValueChange={(value) => {
                    setSelectedSupervisor(value);
                    setSelectedSupervisee(""); // Reset supervisee when supervisor changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors?.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.display_name} ({supervisor.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisee</label>
                <Select
                  value={selectedSupervisee}
                  onValueChange={setSelectedSupervisee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisee" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisees?.map((supervisee) => (
                      <SelectItem key={supervisee.id} value={supervisee.id}>
                        {supervisee.display_name} ({supervisee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateRelationship}
                disabled={createRelationship.isPending}
              >
                {createRelationship.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Relationship
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supervisor</TableHead>
                <TableHead>Supervisor Role</TableHead>
                <TableHead>Supervisee</TableHead>
                <TableHead>Supervisee Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships?.map((relationship) => (
                <TableRow key={relationship.id}>
                  <TableCell>{relationship.supervisor_name}</TableCell>
                  <TableCell>{relationship.supervisor_role}</TableCell>
                  <TableCell>{relationship.supervisee_name}</TableCell>
                  <TableCell>{relationship.supervisee_role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={relationship.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {relationship.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {relationship.status === "ACTIVE" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => relationship.id && endRelationship.mutate(relationship.id)}
                        disabled={endRelationship.isPending}
                      >
                        End Supervision
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
