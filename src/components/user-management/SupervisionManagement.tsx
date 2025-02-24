
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
  DialogDescription,
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
import { UserRole } from "@/lib/roles";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export const SupervisionManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddToExistingOpen, setIsAddToExistingOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedSupervisees, setSelectedSupervisees] = useState<string[]>([]);
  const [selectedExistingSupervisor, setSelectedExistingSupervisor] = useState<string>("");
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

  // Fetch active supervisors for the "Add to Existing" feature
  const { data: activeSupervisors, isLoading: isLoadingActiveSupervisors } = useQuery({
    queryKey: ['active-supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_supervisors')
        .select('*')
        .order('supervisor_name');

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
        .in('role', ['AP', 'AD'] as UserRole[])
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });

  // Get the selected supervisor's role (for new relationships)
  const selectedSupervisorRole = supervisors?.find(
    supervisor => supervisor.id === selectedSupervisor
  )?.role as UserRole | undefined;

  // Get the selected existing supervisor's role
  const selectedExistingSupervisorRole = activeSupervisors?.find(
    supervisor => supervisor.supervisor_id === selectedExistingSupervisor
  )?.supervisor_role as UserRole | undefined;

  // Fetch potential supervisees based on the supervisor's role (works for both new and existing)
  const { data: supervisees, isLoading: isLoadingSupervisees } = useQuery({
    queryKey: ['potential-supervisees', selectedSupervisorRole || selectedExistingSupervisorRole],
    enabled: !!(selectedSupervisorRole || selectedExistingSupervisorRole),
    queryFn: async () => {
      const role = selectedSupervisorRole || selectedExistingSupervisorRole;
      const allowedRoles = role === 'AD' 
        ? ['AP'] as UserRole[]  // AD can only supervise AP
        : ['IT', 'IP', 'IC'] as UserRole[];  // AP can supervise IT, IP, and IC

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', allowedRoles)
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });

  // Mutation to create new supervision relationships (handles multiple supervisees)
  const createRelationships = useMutation({
    mutationFn: async () => {
      const relationships = selectedSupervisees.map(superviseeId => ({
        supervisor_id: selectedSupervisor,
        supervisee_id: superviseeId,
        status: 'ACTIVE'
      }));

      const { error } = await supabase
        .from('supervision_relationships')
        .insert(relationships);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Supervision relationships created successfully');
      setIsAddOpen(false);
      setSelectedSupervisor("");
      setSelectedSupervisees([]);
    },
    onError: (error) => {
      toast.error('Failed to create supervision relationships');
      console.error('Error creating relationships:', error);
    },
  });

  // Mutation to add supervisees to existing supervision relationship
  const addToExistingSupervision = useMutation({
    mutationFn: async () => {
      const relationships = selectedSupervisees.map(superviseeId => ({
        supervisor_id: selectedExistingSupervisor,
        supervisee_id: superviseeId,
        status: 'ACTIVE'
      }));

      const { error } = await supabase
        .from('supervision_relationships')
        .insert(relationships);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-relationships'] });
      toast.success('Supervisees added successfully to existing supervision');
      setIsAddToExistingOpen(false);
      setSelectedExistingSupervisor("");
      setSelectedSupervisees([]);
    },
    onError: (error) => {
      toast.error('Failed to add supervisees');
      console.error('Error adding supervisees:', error);
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
    if (!selectedSupervisor || selectedSupervisees.length === 0) {
      toast.error('Please select both supervisor and at least one supervisee');
      return;
    }
    createRelationships.mutate();
  };

  const handleAddToExisting = () => {
    if (!selectedExistingSupervisor || selectedSupervisees.length === 0) {
      toast.error('Please select both supervisor and at least one supervisee');
      return;
    }
    addToExistingSupervision.mutate();
  };

  const handleSuperviseeToggle = (superviseeId: string) => {
    setSelectedSupervisees(current => 
      current.includes(superviseeId)
        ? current.filter(id => id !== superviseeId)
        : [...current, superviseeId]
    );
  };

  if (isLoadingRelationships || isLoadingSupervisors || isLoadingSupervisees || isLoadingActiveSupervisors) {
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
        <div className="flex gap-2">
          {/* Add to Existing Dialog */}
          <Dialog open={isAddToExistingOpen} onOpenChange={setIsAddToExistingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users2 className="mr-2 h-4 w-4" />
                Add to Existing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add to Existing Supervision</DialogTitle>
                <DialogDescription>
                  Select an active supervisor and add new supervisees to their supervision group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Existing Supervisor</label>
                  <Select
                    value={selectedExistingSupervisor}
                    onValueChange={(value) => {
                      setSelectedExistingSupervisor(value);
                      setSelectedSupervisees([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSupervisors?.map((supervisor) => (
                        <SelectItem key={supervisor.supervisor_id} value={supervisor.supervisor_id}>
                          {supervisor.supervisor_name} ({supervisor.supervisor_role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedExistingSupervisor && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Supervisees</label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-2">
                        {supervisees?.map((supervisee) => (
                          <div key={supervisee.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`supervisee-${supervisee.id}`}
                              checked={selectedSupervisees.includes(supervisee.id)}
                              onCheckedChange={() => handleSuperviseeToggle(supervisee.id)}
                            />
                            <label htmlFor={`supervisee-${supervisee.id}`} className="text-sm">
                              {supervisee.display_name} ({supervisee.role})
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleAddToExisting}
                  disabled={addToExistingSupervision.isPending}
                >
                  {addToExistingSupervision.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Selected Supervisees
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create New Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus2 className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Supervision Relationship</DialogTitle>
                <DialogDescription>
                  Select a supervisor and one or more supervisees to create new supervision relationships.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supervisor</label>
                  <Select
                    value={selectedSupervisor}
                    onValueChange={(value) => {
                      setSelectedSupervisor(value);
                      setSelectedSupervisees([]);
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
                {selectedSupervisor && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Supervisees</label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-2">
                        {supervisees?.map((supervisee) => (
                          <div key={supervisee.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`supervisee-${supervisee.id}`}
                              checked={selectedSupervisees.includes(supervisee.id)}
                              onCheckedChange={() => handleSuperviseeToggle(supervisee.id)}
                            />
                            <label htmlFor={`supervisee-${supervisee.id}`} className="text-sm">
                              {supervisee.display_name} ({supervisee.role})
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreateRelationship}
                  disabled={createRelationships.isPending}
                >
                  {createRelationships.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Relationships
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
