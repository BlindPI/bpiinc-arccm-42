import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apUserService, type APUser, type APUserLocationAssignment } from '@/services/provider/apUserService';
import { toast } from 'sonner';
import { 
  UserCheck, 
  MapPin, 
  Building2, 
  Users, 
  Mail, 
  Phone,
  Briefcase,
  Calendar,
  Target,
  Plus,
  X
} from 'lucide-react';
import { APUserSelectionDialog } from './APUserSelectionDialog';

export function APUserManagementDashboard() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAPUser, setSelectedAPUser] = useState<APUser | null>(null);

  // Fetch all AP users
  const { data: apUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['ap-users'],
    queryFn: () => apUserService.getAPUsers()
  });

  // Fetch all AP user assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['ap-user-assignments'],
    queryFn: () => apUserService.getAPUserAssignments()
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ apUserId, locationId }: { apUserId: string; locationId: string }) => {
      return await apUserService.removeAPUserFromLocation(apUserId, locationId);
    },
    onSuccess: () => {
      toast.success('AP user removed from location successfully');
      queryClient.invalidateQueries({ queryKey: ['ap-user-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    },
    onError: (error: any) => {
      toast.error('Failed to remove AP user assignment');
    }
  });

  const handleRemoveAssignment = (apUserId: string, locationId: string) => {
    if (confirm('Are you sure you want to remove this AP user from this location?')) {
      removeAssignmentMutation.mutate({ apUserId, locationId });
    }
  };

  const handleAssignmentCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['ap-user-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
  };

  // Group assignments by AP user
  const assignmentsByUser = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.ap_user_id]) {
      acc[assignment.ap_user_id] = [];
    }
    acc[assignment.ap_user_id].push(assignment);
    return acc;
  }, {} as Record<string, APUserLocationAssignment[]>);

  const renderAPUserCard = (apUser: APUser) => {
    const userAssignments = assignmentsByUser[apUser.id] || [];
    const activeAssignments = userAssignments.filter(a => a.status === 'active');

    return (
      <Card key={apUser.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{apUser.display_name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {apUser.email}
                  </div>
                  {apUser.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {apUser.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary">AP User</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {activeAssignments.length} location{activeAssignments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {apUser.organization && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{apUser.organization}</span>
              {apUser.job_title && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{apUser.job_title}</span>
                </>
              )}
            </div>
          )}

          {activeAssignments.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Location Assignments:</h4>
              {activeAssignments.map((assignment) => (
                <div 
                  key={assignment.assignment_id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{assignment.location_name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Role: {assignment.assignment_role}</span>
                        <span>Teams: {assignment.team_count}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Since {new Date(assignment.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.ap_user_id, assignment.location_id)}
                    disabled={removeAssignmentMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No location assignments</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAssignmentsList = () => {
    if (assignments.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AP user assignments found</p>
          <p className="text-sm">Assign AP users to locations to get started</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.assignment_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{assignment.ap_user_name}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.ap_user_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{assignment.location_name}</span>
                    {assignment.location_city && (
                      <span className="text-sm text-muted-foreground">
                        • {assignment.location_city}, {assignment.location_state}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <Badge variant="secondary">{assignment.assignment_role}</Badge>
                    <p className="text-muted-foreground mt-1">
                      {assignment.team_count} team{assignment.team_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.ap_user_id, assignment.location_id)}
                    disabled={removeAssignmentMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loadingUsers || loadingAssignments) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading AP user data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AP User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage Authorized Provider users and their location assignments
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign AP User
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total AP Users</p>
                <p className="text-2xl font-bold">{apUsers.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Users</p>
                <p className="text-2xl font-bold">
                  {Object.keys(assignmentsByUser).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="by-user">
            <TabsList className="w-full">
              <TabsTrigger value="by-user">By AP User</TabsTrigger>
              <TabsTrigger value="by-assignment">By Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="by-user" className="space-y-4">
              {apUsers.length > 0 ? (
                apUsers.map(renderAPUserCard)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AP users found</p>
                  <p className="text-sm">Users must be assigned the AP role first</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="by-assignment" className="space-y-4">
              {renderAssignmentsList()}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <APUserSelectionDialog 
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onProviderCreated={handleAssignmentCreated}
      />
    </div>
  );
}