
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Video, 
  Share2, 
  Bell,
  Users,
  Calendar,
  FileText,
  Zap,
  Globe,
  Send,
  Plus
} from 'lucide-react';

export function TeamCollaborationHub() {
  const [activeTab, setActiveTab] = useState('channels');
  const [newMessage, setNewMessage] = useState('');

  // Mock collaboration data
  const communicationChannels = [
    {
      id: '1',
      name: 'Cross-Location Updates',
      type: 'announcement',
      members: 45,
      lastActivity: '2 minutes ago',
      unread: 3,
      location: 'All Locations'
    },
    {
      id: '2',
      name: 'NY-LA Project Sync',
      type: 'project',
      members: 12,
      lastActivity: '15 minutes ago',
      unread: 0,
      location: 'New York, Los Angeles'
    },
    {
      id: '3',
      name: 'Training Coordinators',
      type: 'team',
      members: 8,
      lastActivity: '1 hour ago',
      unread: 2,
      location: 'Chicago, Seattle'
    }
  ];

  const recentActivities = [
    {
      type: 'meeting',
      title: 'Cross-location team standup',
      participants: ['NY Team', 'Chicago Team'],
      time: '30 minutes ago',
      status: 'completed'
    },
    {
      type: 'document',
      title: 'Q4 Training Schedule shared',
      sharedBy: 'Sarah Chen',
      locations: ['All Locations'],
      time: '1 hour ago',
      status: 'active'
    },
    {
      type: 'announcement',
      title: 'New collaboration guidelines published',
      author: 'Team Admin',
      time: '2 hours ago',
      status: 'active'
    }
  ];

  const upcomingMeetings = [
    {
      title: 'Weekly Cross-Location Sync',
      time: 'Today 3:00 PM EST',
      participants: ['NY', 'Chicago', 'LA'],
      type: 'recurring'
    },
    {
      title: 'Project Alpha Review',
      time: 'Tomorrow 10:00 AM EST',
      participants: ['NY', 'Seattle'],
      type: 'project'
    },
    {
      title: 'Monthly All-Hands',
      time: 'Friday 2:00 PM EST',
      participants: ['All Locations'],
      type: 'company'
    }
  ];

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Bell className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-green-100 text-green-800';
      case 'team': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="h-8 w-8 text-primary" />
            Team Collaboration Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Communication and collaboration tools for distributed teams
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Channel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Channels List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Communication Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {communicationChannels.map((channel) => (
                      <div key={channel.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(channel.type)}
                              <span className="font-medium">{channel.name}</span>
                            </div>
                            <Badge className={getChannelColor(channel.type)}>
                              {channel.type}
                            </Badge>
                            {channel.unread > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {channel.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{channel.members} members • {channel.location}</span>
                          <span>{channel.lastActivity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Send a message to all teams..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send to All
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Presence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New York</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chicago</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Los Angeles</span>
                      <Badge variant="secondary">Away</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Miami</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Seattle</span>
                      <Badge variant="secondary">Away</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-sm text-muted-foreground">{meeting.time}</div>
                      <div className="text-sm text-muted-foreground">
                        Participants: {meeting.participants.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meeting.type}</Badge>
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Documents & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Document Collaboration</h3>
                <p>Shared workspace for cross-location document collaboration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {activity.type === 'meeting' && <Video className="h-4 w-4 text-primary" />}
                      {activity.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
                      {activity.type === 'announcement' && <Bell className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.type === 'meeting' && `Participants: ${activity.participants?.join(', ')}`}
                        {activity.type === 'document' && `Shared by: ${activity.sharedBy} • ${activity.locations?.join(', ')}`}
                        {activity.type === 'announcement' && `By: ${activity.author}`}
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'secondary' : 'default'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Integration Hub</h3>
                <p>Connect with external collaboration tools and services</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
