import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RosterBuilder } from './RosterBuilder';
import { RosterTable } from './RosterTable';
import { RosterExportDialog } from './RosterExportDialog';

interface StudentRoster {
  id: string;
  roster_name: string;
  course_name: string;
  location_id: string;
  instructor_id: string;
  max_capacity: number;
  current_enrollment: number;
  roster_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  scheduled_start_date: string;
  scheduled_end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  locations?: {
    name: string;
    city: string;
    state: string;
  };
  profiles?: {
    display_name: string;
  };
}

export function RosterManagement() {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [selectedRoster, setSelectedRoster] = useState<StudentRoster | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all rosters
  const { data: rosters = [], isLoading } = useQuery({
    queryKey: ['student-rosters', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('student_rosters')
        .select(`
          *,
          locations!inner(name, city, state),
          profiles!student_rosters_instructor_id_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('roster_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudentRoster[];
    }
  });

  // Delete roster mutation
  const deleteRosterMutation = useMutation({
    mutationFn: async (rosterId: string) => {
      const { error } = await supabase
        .from('student_rosters')
        .delete()
        .eq('id', rosterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete roster: ${error.message}`);
    }
  });

  // Enhanced export roster mutation
  const exportRosterMutation = useMutation({
    mutationFn: async (rosterId: string) => {
      setSelectedRoster(rosters.find(r => r.id === rosterId) || null);
      setShowExportDialog(true);
    },
    onError: (error: Error) => {
      toast.error(`Failed to open export dialog: ${error.message}`);
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'DRAFT': return 'outline';
      case 'ARCHIVED': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'DRAFT': return <Edit className="h-4 w-4" />;
      case 'ARCHIVED': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Roster</h2>
            <p className="text-muted-foreground">Build a roster from enrolled students</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <RosterBuilder onComplete={() => setActiveView('list')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roster Management</h2>
          <p className="text-muted-foreground">Manage course rosters and enrollments</p>
        </div>
        <Button onClick={() => setActiveView('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Roster
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rosters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rosters Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first roster to start managing course enrollments.
            </p>
            <Button onClick={() => setActiveView('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Roster
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rosters.map((roster) => (
            <Card key={roster.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{roster.roster_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(roster.roster_status)} className="text-xs">
                        {getStatusIcon(roster.roster_status)}
                        <span className="ml-1">{roster.roster_status}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    {roster.course_name}
                  </div>
                  {roster.locations && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {roster.locations.name}, {roster.locations.city}
                    </div>
                  )}
                  {roster.profiles && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      {roster.profiles.display_name}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(roster.scheduled_start_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enrollment</span>
                    <span>{roster.current_enrollment} / {roster.max_capacity}</span>
                  </div>
                  <Progress 
                    value={(roster.current_enrollment / roster.max_capacity) * 100} 
                    className="h-2"
                  />
                </div>

                <Separator />

                <div className="flex justify-between gap-2">
                  <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRoster(roster);
                          setShowExportDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      {selectedRoster && (
                        <RosterExportDialog 
                          roster={selectedRoster} 
                          onClose={() => setShowExportDialog(false)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRosterMutation.mutate(roster.id)}
                    disabled={deleteRosterMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}