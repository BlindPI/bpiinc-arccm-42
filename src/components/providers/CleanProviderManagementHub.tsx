/**
 * CLEAN PROVIDER MANAGEMENT HUB
 * Uses CleanAPTeamService - no broken dependencies
 * Matches the nuclear cleanup migration exactly
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CleanAPTeamService } from '@/services/clean/CleanAPTeamService';
import {
  Building2,
  Users,
  MapPin,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

export function CleanProviderManagementHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedAPUser, setSelectedAPUser] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  // Get system health using clean service
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['clean-system-health'],
    queryFn: () => CleanAPTeamService.getSystemHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get available AP users
  const { data: apUsers = [] } = useQuery({
    queryKey: ['clean-ap-users'],
    queryFn: () => CleanAPTeamService.getAvailableAPUsers(),
  });

  // Get available locations
  const { data: locations = [] } = useQuery({
    queryKey: ['clean-locations'],
    queryFn: () => CleanAPTeamService.getAvailableLocations(),
  });

  // Assign AP user to location
  const assignAPUserMutation = useMutation({
    mutationFn: ({ apUserId, locationId }: { apUserId: string; locationId: string }) =>
      CleanAPTeamService.assignAPUserToLocation(apUserId, locationId),
    onSuccess: () => {
      toast.success('AP user assigned to location successfully!');
      queryClient.invalidateQueries({ queryKey: ['clean-system-health'] });
      queryClient.invalidateQueries({ queryKey: ['clean-ap-users'] });
      queryClient.invalidateQueries({ queryKey: ['clean-locations'] });
      setSelectedAPUser('');
      setSelectedLocation('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign AP user: ${error.message}`);
    }
  });

  // Create team with AP user
  const createTeamMutation = useMutation({
    mutationFn: () => CleanAPTeamService.createTeamWithAPUser({
      name: teamName,
      description: teamDescription,
      locationId: selectedLocation,
      apUserId: selectedAPUser
    }),
    onSuccess: () => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['clean-system-health'] });
      setTeamName('');
      setTeamDescription('');
      setSelectedLocation('');
      setSelectedAPUser('');
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const unassignedAPUsers = apUsers.filter(user => !user.isAssigned);
  const assignedAPUsers = apUsers.filter(user => user.isAssigned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage authorized providers, location assignments, and team operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              (systemHealth?.healthScore || 0) >= 90 ? 'bg-green-500' :
              (systemHealth?.healthScore || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              System Health: {systemHealth?.healthScore || 0}%
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
            disabled={healthLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Total AP Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{systemHealth?.totalAPUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth?.assignedAPUsers || 0} assigned
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
            <div className="text-2xl font-bold text-green-600">{systemHealth?.totalTeams || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth?.totalMembers || 0} total members
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
            <div className="text-2xl font-bold text-purple-600">{systemHealth?.totalLocations || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth?.locationsWithAPUsers || 0} with AP users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (systemHealth?.healthScore || 0) >= 90 ? 'text-green-600' :
              (systemHealth?.healthScore || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {systemHealth?.healthScore || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Overall system health</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for unassigned users */}
      {unassignedAPUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              {unassignedAPUsers.length} AP Users Need Location Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              These AP users need to be assigned to locations before they can manage teams.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unassignedAPUsers.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <span className="font-medium">{user.displayName}</span>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-700">
                    Unassigned
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assign">Assign AP Users</TabsTrigger>
          <TabsTrigger value="teams">Create Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned AP Users */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned AP Users ({assignedAPUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedAPUsers.length === 0 ? (
                  <p className="text-muted-foreground">No AP users have been assigned to locations yet.</p>
                ) : (
                  <div className="space-y-3">
                    {assignedAPUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{user.displayName}</span>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-green-700">
                          Assigned
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locations Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Locations Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <p className="text-muted-foreground">No locations available.</p>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{location.name}</span>
                          <p className="text-sm text-gray-500">
                            {location.assignedAPUsers} AP user{location.assignedAPUsers !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign AP User to Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ap-user-select">Select AP User</Label>
                  <Select value={selectedAPUser} onValueChange={setSelectedAPUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an AP user" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedAPUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-select">Select Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-gray-500">
                              {location.assignedAPUsers} AP user{location.assignedAPUsers !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => assignAPUserMutation.mutate({ 
                  apUserId: selectedAPUser, 
                  locationId: selectedLocation 
                })}
                disabled={!selectedAPUser || !selectedLocation || assignAPUserMutation.isPending}
                className="w-full"
              >
                {assignAPUserMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign AP User to Location
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Create Team with AP User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Input
                    id="team-description"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Enter team description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team-ap-user">Assigned AP User</Label>
                  <Select value={selectedAPUser} onValueChange={setSelectedAPUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose assigned AP user" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedAPUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-location">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(loc => loc.assignedAPUsers > 0).map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-gray-500">
                              {location.assignedAPUsers} AP user{location.assignedAPUsers !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => createTeamMutation.mutate()}
                disabled={!teamName || !selectedAPUser || !selectedLocation || createTeamMutation.isPending}
                className="w-full"
              >
                {createTeamMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}