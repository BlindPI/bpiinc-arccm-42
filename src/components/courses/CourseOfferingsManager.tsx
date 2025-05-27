
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CourseOffering {
  id: string;
  course_id: string;
  instructor_id?: string;
  location_id?: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: string;
  created_at: string;
  courses?: { name: string };
  locations?: { name: string };
  profiles?: { display_name: string };
}

export const CourseOfferingsManager: React.FC = () => {
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: offerings, isLoading } = useQuery({
    queryKey: ['course-offerings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          *,
          courses(name),
          locations(name),
          profiles(display_name)
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as CourseOffering[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['course-offerings-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select('status, max_participants')
        .gte('start_date', new Date().toISOString());

      if (error) throw error;

      const total = data.length;
      const totalCapacity = data.reduce((sum, offering) => sum + offering.max_participants, 0);
      const scheduled = data.filter(o => o.status === 'SCHEDULED').length;

      return {
        totalOfferings: total,
        scheduledOfferings: scheduled,
        totalCapacity,
        availableSlots: totalCapacity // Simplified - would need enrollment data
      };
    }
  });

  const deleteOfferingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_offerings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course offering deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['course-offerings'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete offering: ${error.message}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'default';
      case 'IN_PROGRESS': return 'secondary';
      case 'COMPLETED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Offerings</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading course offerings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Offerings Management</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage course offerings and enrollment
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Offering
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Offerings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduledOfferings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCapacity || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all offerings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableSlots || 0}</div>
            <p className="text-xs text-muted-foreground">
              Open for enrollment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOfferings || 0}</div>
            <p className="text-xs text-muted-foreground">
              All scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Offerings</CardTitle>
        </CardHeader>
        <CardContent>
          {!offerings || offerings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No course offerings found</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Offering
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerings.map((offering) => (
                  <TableRow key={offering.id}>
                    <TableCell className="font-medium">
                      {offering.courses?.name || 'Unknown Course'}
                    </TableCell>
                    <TableCell>
                      {offering.profiles?.display_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {offering.locations?.name || 'TBD'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(offering.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(offering.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {offering.max_participants} max
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(offering.status)}>
                        {offering.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteOfferingMutation.mutate(offering.id)}
                      >
                        Delete
                      </Button>
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
