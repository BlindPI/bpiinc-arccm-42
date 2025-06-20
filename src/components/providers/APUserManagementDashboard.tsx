import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { correctedAPProviderService } from '@/services/provider/correctedAPProviderService';
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
  X,
  AlertCircle
} from 'lucide-react';
import { APUserSelectionDialog } from './APUserSelectionDialog';

// Simplified types aligned with corrected architecture
interface APUserWithAssignments {
  id: string;
  display_name: string;
  email: string;
  organization?: string;
  assignedLocations: number;
  locationNames: string[];
  managedTeams: number;
  assignmentStatus: 'assigned' | 'unassigned';
}

export function APUserManagementDashboard() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch system overview using corrected service
  const { data: systemData, isLoading: loadingSystem } = useQuery({
    queryKey: ['ap-system-overview'],
    queryFn: async () => {
      const result = await correctedAPProviderService.getSystemOverview();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load system overview');
      }
      return result.data;
    }
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ apUserId, locationId }: { apUserId: string; locationId: string }) => {
      const result = await correctedAPProviderService.removeAPUserFromLocation(apUserId, locationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove assignment');
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || 'AP user removed from location successfully');
      queryClient.invalidateQueries({ queryKey: ['ap-system-overview'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove AP user assignment');
    }
  });

  const handleRemoveAssignment = (apUserId: string, locationId: string) => {
    if (confirm('Are you sure you want to remove this AP user from this location?')) {
      removeAssignmentMutation.mutate({ apUserId, locationId });
    }
  };

  const handleAssignmentCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['ap-system-overview'] });
  };

  const renderAPUserCard = (apUser: APUserWithAssignments) => {
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
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={apUser.assignmentStatus === 'assigned' ? 'default' : 'secondary'}>
                {apUser.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {apUser.assignedLocations} location{apUser.assignedLocations !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {apUser.organization && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{apUser.organization}</span>
            </div>
          )}

          {apUser.assignedLocations > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Location Assignments:</h4>
              <div className="flex flex-wrap gap-2">
                {apUser.locationNames.map((locationName) => (
                  <Badge key={locationName} variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {locationName}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span>Managed Teams: {apUser.managedTeams}</span>
              </div>
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

  if (loadingSystem) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading AP user data...</p>
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load AP user data</p>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ap-system-overview'] })}
          className="mt-4"
        >
          Retry
        </Button>
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
                <p className="text-2xl font-bold">{systemData.summary.totalAPUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Assigned AP Users</p>
                <p className="text-2xl font-bold">
                  {systemData.summary.assignedAPUsers}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Managed Teams</p>
                <p className="text-2xl font-bold">
                  {systemData.summary.totalManagedTeams}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>

            {systemData.issues.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-800">Issues Found</p>
                </div>
                <ul className="text-xs text-red-700 space-y-1">
                  {systemData.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="by-user">
            <TabsList className="w-full">
              <TabsTrigger value="by-user">By AP User</TabsTrigger>
              <TabsTrigger value="by-assignment">By Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="by-user" className="space-y-4">
              {systemData.apUsers.length > 0 ? (
                systemData.apUsers.map(renderAPUserCard)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AP users found</p>
                  <p className="text-sm">Users must be assigned the AP role first</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="by-assignment" className="space-y-4">
              <div className="space-y-4">
                {systemData.apUsers
                  .filter(user => user.assignmentStatus === 'assigned')
                  .map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{user.display_name}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-wrap gap-1">
                                {user.locationNames.map((locationName) => (
                                  <Badge key={locationName} variant="outline" className="text-xs">
                                    {locationName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <Badge variant="secondary">
                              {user.assignedLocations} location{user.assignedLocations !== 1 ? 's' : ''}
                            </Badge>
                            <p className="text-muted-foreground mt-1">
                              {user.managedTeams} team{user.managedTeams !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {systemData.apUsers.filter(user => user.assignmentStatus === 'assigned').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No AP user assignments found</p>
                    <p className="text-sm">Assign AP users to locations to get started</p>
                  </div>
                )}
              </div>
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