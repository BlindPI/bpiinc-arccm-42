
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Settings
} from 'lucide-react';

interface LocationResourceManagerProps {
  teams: any[];
}

export function LocationResourceManager({ teams }: LocationResourceManagerProps) {
  const [activeTab, setActiveTab] = useState('capacity');

  // Mock resource data
  const locationResources = [
    {
      location: 'New York',
      capacity: {
        teams: { current: 15, max: 20, utilization: 75 },
        members: { current: 87, max: 120, utilization: 73 },
        sessions: { current: 45, max: 60, utilization: 75 }
      },
      equipment: {
        computers: { available: 45, total: 50, status: 'good' },
        training_rooms: { available: 3, total: 5, status: 'needs_attention' },
        av_equipment: { available: 12, total: 15, status: 'excellent' }
      },
      schedule: {
        peak_hours: '9AM-12PM, 2PM-5PM',
        availability: 68,
        conflicts: 2
      }
    },
    {
      location: 'Chicago',
      capacity: {
        teams: { current: 12, max: 15, utilization: 80 },
        members: { current: 65, max: 90, utilization: 72 },
        sessions: { current: 32, max: 45, utilization: 71 }
      },
      equipment: {
        computers: { available: 38, total: 40, status: 'excellent' },
        training_rooms: { available: 4, total: 4, status: 'good' },
        av_equipment: { available: 8, total: 10, status: 'good' }
      },
      schedule: {
        peak_hours: '8AM-11AM, 1PM-4PM',
        availability: 72,
        conflicts: 1
      }
    },
    {
      location: 'Los Angeles',
      capacity: {
        teams: { current: 18, max: 25, utilization: 72 },
        members: { current: 102, max: 150, utilization: 68 },
        sessions: { current: 56, max: 75, utilization: 75 }
      },
      equipment: {
        computers: { available: 62, total: 65, status: 'excellent' },
        training_rooms: { available: 6, total: 8, status: 'excellent' },
        av_equipment: { available: 18, total: 20, status: 'good' }
      },
      schedule: {
        peak_hours: '9AM-12PM, 3PM-6PM',
        availability: 75,
        conflicts: 0
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Location Resource Management</h2>
          <p className="text-muted-foreground">Monitor and optimize resource allocation across locations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Resource Settings
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Optimize Resources
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity" className="space-y-6">
          <div className="grid gap-6">
            {locationResources.map((location) => (
              <Card key={location.location}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{location.location} - Capacity Overview</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Avg {Math.round((location.capacity.teams.utilization + 
                        location.capacity.members.utilization + 
                        location.capacity.sessions.utilization) / 3)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Teams</span>
                        <span className="text-sm text-muted-foreground">
                          {location.capacity.teams.current}/{location.capacity.teams.max}
                        </span>
                      </div>
                      <Progress value={location.capacity.teams.utilization} />
                      <div className={`text-sm font-medium ${getUtilizationColor(location.capacity.teams.utilization)}`}>
                        {location.capacity.teams.utilization}% utilized
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Members</span>
                        <span className="text-sm text-muted-foreground">
                          {location.capacity.members.current}/{location.capacity.members.max}
                        </span>
                      </div>
                      <Progress value={location.capacity.members.utilization} />
                      <div className={`text-sm font-medium ${getUtilizationColor(location.capacity.members.utilization)}`}>
                        {location.capacity.members.utilization}% utilized
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sessions</span>
                        <span className="text-sm text-muted-foreground">
                          {location.capacity.sessions.current}/{location.capacity.sessions.max}
                        </span>
                      </div>
                      <Progress value={location.capacity.sessions.utilization} />
                      <div className={`text-sm font-medium ${getUtilizationColor(location.capacity.sessions.utilization)}`}>
                        {location.capacity.sessions.utilization}% utilized
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <div className="grid gap-6">
            {locationResources.map((location) => (
              <Card key={location.location}>
                <CardHeader>
                  <CardTitle>{location.location} - Equipment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <span className="font-medium">Computers</span>
                        </div>
                        <Badge className={getStatusColor(location.equipment.computers.status)}>
                          {location.equipment.computers.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {location.equipment.computers.available}/{location.equipment.computers.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Training Rooms</span>
                        </div>
                        <Badge className={getStatusColor(location.equipment.training_rooms.status)}>
                          {location.equipment.training_rooms.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {location.equipment.training_rooms.available}/{location.equipment.training_rooms.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">AV Equipment</span>
                        </div>
                        <Badge className={getStatusColor(location.equipment.av_equipment.status)}>
                          {location.equipment.av_equipment.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {location.equipment.av_equipment.available}/{location.equipment.av_equipment.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <div className="grid gap-6">
            {locationResources.map((location) => (
              <Card key={location.location}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{location.location} - Schedule Management</span>
                    <div className="flex items-center gap-2">
                      {location.schedule.conflicts > 0 ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {location.schedule.conflicts} conflicts
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          No conflicts
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Peak Hours</span>
                      </div>
                      <div className="text-lg">{location.schedule.peak_hours}</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Availability</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {location.schedule.availability}%
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Conflicts</span>
                      </div>
                      <div className={`text-lg font-bold ${location.schedule.conflicts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {location.schedule.conflicts}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Capacity Rebalancing</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Chicago location is at 80% team capacity. Consider redistributing 2-3 teams to New York or Los Angeles.
                  </p>
                  <Button size="sm" variant="outline">Apply Recommendation</Button>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Equipment Optimization</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Los Angeles has excellent equipment status. Share maintenance practices with other locations.
                  </p>
                  <Button size="sm" variant="outline">Share Best Practices</Button>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Schedule Efficiency</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    New York has 2 scheduling conflicts. Implement automated conflict resolution system.
                  </p>
                  <Button size="sm" variant="outline">Enable Auto-Resolution</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
