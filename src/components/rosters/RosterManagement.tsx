
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RosterService } from '@/services/roster/rosterService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const RosterManagement: React.FC = () => {
  const [selectedRoster, setSelectedRoster] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rosters, isLoading } = useQuery({
    queryKey: ['rosters'],
    queryFn: () => RosterService.getAllRosters()
  });

  const deleteRosterMutation = useMutation({
    mutationFn: (id: string) => RosterService.deleteRoster(id),
    onSuccess: () => {
      toast.success('Roster deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete roster: ${error.message}`);
    }
  });

  const handleDeleteRoster = (id: string) => {
    if (confirm('Are you sure you want to delete this roster?')) {
      deleteRosterMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Roster Management</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading rosters...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage course rosters and certificate batches
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Roster
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rosters</CardTitle>
        </CardHeader>
        <CardContent>
          {!rosters || rosters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No rosters found</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Roster
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters.map((roster) => (
                  <TableRow key={roster.id}>
                    <TableCell className="font-medium">{roster.name}</TableCell>
                    <TableCell>{(roster as any).courses?.name || 'N/A'}</TableCell>
                    <TableCell>{(roster as any).locations?.name || 'N/A'}</TableCell>
                    <TableCell>{roster.instructor_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roster.certificate_count} certificates
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(roster.status)}>
                        {roster.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(roster.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRoster(roster.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoster(roster.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
