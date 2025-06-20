import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedAPTeamService, type SystemOverview } from '@/services/unified/UnifiedAPTeamService';
import {
  MapPin,
  Users,
  UserPlus,
  Building2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export function UnifiedLocationTeamManagement() {
  const queryClient = useQueryClient();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<Array<{ apUserId: string; locationId: string }>>([]);

  // Get system overview
  const { data: systemOverview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['system-overview'],
    queryFn: () => UnifiedAPTeamService.getSystemOverview(),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Get AP users
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users'],
    queryFn: () => UnifiedAPTeamService.getAPUsers(),
  });

  // Get available locations
  const { data: locations = [] } = useQuery({
    queryKey: ['available-locations'],
    queryFn: () => UnifiedAPTeamService.getAvailableLocations(),
  });

  // Single assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ apUserId, locationId }: { apUserId: string; locationId: string }) =>
      UnifiedAPTeamService.assignAPUserToLocation(apUserId, locationId),
    onSuccess: () => {
      toast.success('AP user assigned successfully');
      setIsAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['system-overview'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
      queryClient.invalidateQueries({ queryKey: ['available-locations'] });
    },
    onError: (error: any) => {
      toast.error(`Assignment failed: ${error.message}`);
    }
  });

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (assignments: Array<{ apUserId: string; locationId: string }>) =>
      UnifiedAPTeamService.bulkAssignAPUsers(assignments),
    onSuccess: (results) => {
      toast.success(`Bulk assignment completed: ${results.success} successful, ${results.failed} failed`);
      if (results.errors.length > 0) {
        console.warn('Bulk assignment errors:', results.errors);
      }
      setBulkAssignMode(false);
      setSelectedAssignments([]);
      queryClient.invalidateQueries({ queryKey: ['system-overview'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
    },
    onError: (error: any) => {
      toast.error(`Bulk assignment failed: ${error.message}`);
    }
  });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = systemOverview || {
    totalAPUsers: 0,
    assignedAPUsers: 0,
    unassignedAPUsers: 0,
    totalLocations: 0,
    locationsWithAPUsers: 0,
    totalTeams: 0,
    activeTeams: 0,
    totalMembers: 0,
    healthScore: 0,
    issues: []
  };

  const criticalIssues = overview.issues.filter(issue => issue.severity === 'error');
  const warningIssues = overview.issues.filter(issue => issue.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Unified management of AP users, locations, and team assignments
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              overview.healthScore >= 90 ? 'bg-green-500' :
              overview.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              System Health: {overview.healthScore}%
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            disabled={overviewLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${overviewLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Assign AP User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign AP User to Location</DialogTitle>
              </DialogHeader>
              <AssignmentForm
                apUsers={apUsers}
                locations={locations}
                onSubmit={(data) => assignMutation.mutate(data)}
                isLoading={assignMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              AP Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overview.totalAPUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.assignedAPUsers} assigned, {overview.unassignedAPUsers} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview.totalLocations}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.locationsWithAPUsers} with AP users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overview.totalTeams}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.activeTeams} active teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overview.totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total team members
            </p>  
          </CardContent>
        </Card>
      </div>

      {/* System Issues Alert */}
      {overview.issues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              System Issues Detected ({overview.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalIssues.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">
                  Critical Issues ({criticalIssues.length})
                </h4>
                <div className="space-y-2">
                  {criticalIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                      <div>
                        <span className="font-medium text-red-800">{issue.affectedName}</span>
                        <p className="text-sm text-red-600">{issue.message}</p>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {warningIssues.length > 0 && (
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  Warnings ({warningIssues.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {warningIssues.slice(0, 6).map((issue, index) => (
                    <div key={index} className="p-2 bg-amber-50 border border-amber-200 rounded">
                      <span className="font-medium text-amber-800">{issue.affectedName}</span>
                      <p className="text-sm text-amber-600">{issue.message}</p>
                    </div>
                  ))}
                  {warningIssues.length > 6 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded flex items-center justify-center">
                      <span className="text-sm text-amber-600">
                        +{warningIssues.length - 6} more warnings
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Management Interface */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">AP Assignments</TabsTrigger>
          <TabsTrigger value="locations">Location Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Management</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <AssignmentsOverview
            apUsers={apUsers}
            locations={locations}
            onAssign={(apUserId, locationId) => assignMutation.mutate({ apUserId, locationId })}
            isAssigning={assignMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsOverview locations={locations} />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsOverview overview={overview} />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkOperations
            apUsers={apUsers}
            locations={locations}
            onBulkAssign={(assignments) => bulkAssignMutation.mutate(assignments)}
            isProcessing={bulkAssignMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Assignment Form Component
interface AssignmentFormProps {
  apUsers: Array<{ id: string; displayName: string; email: string; assignmentStatus: string }>;
  locations: Array<{ id: string; name: string; assignedAPUsers: number }>;
  onSubmit: (data: { apUserId: string; locationId: string }) => void;
  isLoading: boolean;
}

function AssignmentForm({ apUsers, locations, onSubmit, isLoading }: AssignmentFormProps) {
  const [selectedAPUser, setSelectedAPUser] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const unassignedUsers = apUsers.filter(user => user.assignmentStatus === 'unassigned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAPUser && selectedLocation) {
      onSubmit({ apUserId: selectedAPUser, locationId: selectedLocation });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>AP User</Label>
        <Select value={selectedAPUser} onValueChange={setSelectedAPUser}>
          <SelectTrigger>
            <SelectValue placeholder="Select AP user to assign" />
          </SelectTrigger>
          <SelectContent>
            {unassignedUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.displayName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          {unassignedUsers.length} unassigned AP users available
        </p>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name} ({location.assignedAPUsers} AP users)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isLoading || !selectedAPUser || !selectedLocation}
        >
          {isLoading ? 'Assigning...' : 'Assign AP User'}
        </Button>
      </div>
    </form>
  );
}

// Assignments Overview Component
function AssignmentsOverview({ 
  apUsers, 
  locations,
  onAssign,
  isAssigning 
}: {
  apUsers: Array<{ id: string; displayName: string; email: string; assignmentStatus: string }>;
  locations: Array<{ id: string; name: string; assignedAPUsers: number }>;
  onAssign: (apUserId: string, locationId: string) => void;
  isAssigning: boolean;
}) {
  const assignedUsers = apUsers.filter(user => user.assignmentStatus === 'assigned');
  const unassignedUsers = apUsers.filter(user => user.assignmentStatus === 'unassigned');

  return (
    <div className="grid gap-6">
      {unassignedUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">
              Unassigned AP Users ({unassignedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {unassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Unassigned
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Assigned AP Users ({assignedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No AP users assigned yet</p>
          ) : (
            <div className="grid gap-2">
              {assignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Assigned
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Locations Overview Component
function LocationsOverview({ 
  locations 
}: {
  locations: Array<{ id: string; name: string; assignedAPUsers: number }>;
}) {
  return (
    <div className="grid gap-4">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {location.name}
              </div>
              <Badge variant={location.assignedAPUsers > 0 ? "default" : "secondary"}>
                {location.assignedAPUsers} AP users
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-500">Assignment Status</div>
                <div className="font-medium">
                  {location.assignedAPUsers > 0 ? 'Active' : 'No assignments'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {location.assignedAPUsers}
                </div>
                <div className="text-sm text-gray-500">AP Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Teams Overview Component
function TeamsOverview({ overview }: { overview: SystemOverview }) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overview.totalTeams}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overview.activeTeams}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{overview.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>Team metrics and distribution charts will be available after running the unified migration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Bulk Operations Component
function BulkOperations({
  apUsers,
  locations,
  onBulkAssign,
  isProcessing
}: {
  apUsers: Array<{ id: string; displayName: string; email: string; assignmentStatus: string }>;
  locations: Array<{ id: string; name: string; assignedAPUsers: number }>;
  onBulkAssign: (assignments: Array<{ apUserId: string; locationId: string }>) => void;
  isProcessing: boolean;
}): React.ReactElement {
  const [selectedAssignments, setSelectedAssignments] = useState<Array<{ apUserId: string; locationId: string }>>([]);
  
  const unassignedUsers = apUsers.filter(user => user.assignmentStatus === 'unassigned');

  const addAssignment = (apUserId: string, locationId: string) => {
    setSelectedAssignments(prev => [...prev, { apUserId, locationId }]);
  };

  const removeAssignment = (index: number) => {
    setSelectedAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkAssign = () => {
    if (selectedAssignments.length > 0) {
      onBulkAssign(selectedAssignments);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Assignment Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No assignments queued. Add assignments below.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedAssignments.map((assignment, index) => {
                const user = apUsers.find(u => u.id === assignment.apUserId);
                const location = locations.find(l => l.id === assignment.locationId);
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{user?.displayName}</span>
                      <span className="mx-2">→</span>
                      <span className="text-blue-600">{location?.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAssignment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
              <div className="pt-4">
                <Button 
                  onClick={handleBulkAssign}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Assign ${selectedAssignments.length} Users`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {unassignedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <Select onValueChange={(locationId) => addAssignment(user.id, locationId)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign to location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}