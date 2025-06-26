import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Phone, 
  Share2, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Send, 
  Search,
  Settings,
  Bell,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Monitor,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Circle,
  Square,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrationStore } from '@/services/integration/ComplianceIntegrationStore';
import { performanceManager } from '@/services/performance/ComponentPerformanceManager';

interface TeamCollaborationPlatformProps {
  userId: string;
  teamId?: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  onCollaborationUpdate?: (update: CollaborationUpdate) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away' | 'in_meeting';
  lastActive: string;
  location?: string;
  timezone: string;
  capabilities: TeamMemberCapability[];
  currentActivity?: string;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
}

interface TeamMemberCapability {
  type: 'audio' | 'video' | 'screen_share' | 'file_share' | 'real_time_edit';
  enabled: boolean;
  quality?: 'low' | 'medium' | 'high';
}

interface SharedWorkspace {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'whiteboard' | 'kanban' | 'calendar' | 'file_manager';
  createdBy: string;
  createdAt: string;
  lastModified: string;
  participants: string[];
  permissions: Record<string, 'view' | 'edit' | 'admin'>;
  isActive: boolean;
  content?: any;
  version: number;
  conflictResolution: 'last_write_wins' | 'merge' | 'manual';
}

interface CollaborationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'system' | 'mention' | 'reaction';
  metadata?: Record<string, any>;
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
}

interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

interface CollaborationUpdate {
  type: 'presence' | 'message' | 'workspace' | 'notification' | 'system';
  data: any;
  timestamp: string;
  userId: string;
}

interface RealTimeSession {
  id: string;
  type: 'audio' | 'video' | 'screen_share' | 'collaborative_edit';
  participants: string[];
  hostId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  settings: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
    recordingEnabled: boolean;
    chatEnabled: boolean;
  };
}

export function TeamCollaborationPlatform({
  userId,
  teamId,
  role,
  onCollaborationUpdate
}: TeamCollaborationPlatformProps) {
  const [activeTab, setActiveTab] = useState<'presence' | 'chat' | 'workspaces' | 'sessions'>('presence');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sharedWorkspaces, setSharedWorkspaces] = useState<SharedWorkspace[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [activeSession, setActiveSession] = useState<RealTimeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Presence tracking
  const [userPresence, setUserPresence] = useState<TeamMember['status']>('online');
  const [userActivity, setUserActivity] = useState<string>('');
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  // Workspace state
  const [selectedWorkspace, setSelectedWorkspace] = useState<SharedWorkspace | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<SharedWorkspace['type']>('document');
  
  // Real-time session state
  const [sessionSettings, setSessionSettings] = useState({
    audioEnabled: true,
    videoEnabled: false,
    screenShareEnabled: false,
    recordingEnabled: false,
    chatEnabled: true
  });

  const { state: integrationState, actions: integrationActions } = useIntegrationStore();

  // Performance tracking
  const trackingIdRef = React.useRef<string>('');

  React.useLayoutEffect(() => {
    trackingIdRef.current = performanceManager.startTracking('TeamCollaborationPlatform', 'render');
    
    return () => {
      if (trackingIdRef.current) {
        performanceManager.endTracking(trackingIdRef.current);
      }
    };
  });

  // Initialize collaboration platform
  const initializeCollaboration = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize mock team members
      const mockTeamMembers: TeamMember[] = [
        {
          id: userId,
          name: 'Current User',
          email: 'user@company.com',
          role: role,
          status: 'online',
          lastActive: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          capabilities: [
            { type: 'audio', enabled: true, quality: 'high' },
            { type: 'video', enabled: true, quality: 'medium' },
            { type: 'screen_share', enabled: true, quality: 'high' },
            { type: 'file_share', enabled: true },
            { type: 'real_time_edit', enabled: true }
          ],
          currentActivity: 'Active in Compliance Platform',
          deviceInfo: {
            type: 'desktop',
            browser: 'Chrome',
            os: 'Windows'
          }
        },
        {
          id: 'team-member-1',
          name: 'Sarah Johnson',
          email: 'sarah@company.com',
          role: 'AP',
          status: 'online',
          lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          timezone: 'America/New_York',
          capabilities: [
            { type: 'audio', enabled: true, quality: 'high' },
            { type: 'video', enabled: true, quality: 'high' },
            { type: 'screen_share', enabled: true, quality: 'medium' },
            { type: 'file_share', enabled: true },
            { type: 'real_time_edit', enabled: true }
          ],
          currentActivity: 'Reviewing compliance documents'
        },
        {
          id: 'team-member-2',
          name: 'Michael Chen',
          email: 'michael@company.com',
          role: 'IC',
          status: 'busy',
          lastActive: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
          timezone: 'America/Los_Angeles',
          capabilities: [
            { type: 'audio', enabled: true, quality: 'medium' },
            { type: 'video', enabled: false },
            { type: 'screen_share', enabled: true, quality: 'low' },
            { type: 'file_share', enabled: true },
            { type: 'real_time_edit', enabled: true }
          ],
          currentActivity: 'In training session'
        },
        {
          id: 'team-member-3',
          name: 'Emma Wilson',
          email: 'emma@company.com',
          role: 'IP',
          status: 'away',
          lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          timezone: 'Europe/London',
          capabilities: [
            { type: 'audio', enabled: true, quality: 'high' },
            { type: 'video', enabled: true, quality: 'high' },
            { type: 'screen_share', enabled: true, quality: 'high' },
            { type: 'file_share', enabled: true },
            { type: 'real_time_edit', enabled: true }
          ],
          currentActivity: 'Away from desk'
        }
      ];

      setTeamMembers(mockTeamMembers);

      // Initialize mock workspaces
      const mockWorkspaces: SharedWorkspace[] = [
        {
          id: 'workspace-1',
          name: 'Compliance Review Board',
          description: 'Shared workspace for reviewing compliance requirements',
          type: 'document',
          createdBy: userId,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          participants: [userId, 'team-member-1', 'team-member-2'],
          permissions: {
            [userId]: 'admin',
            'team-member-1': 'edit',
            'team-member-2': 'view'
          },
          isActive: true,
          version: 1,
          conflictResolution: 'merge'
        },
        {
          id: 'workspace-2',
          name: 'Training Schedule',
          description: 'Collaborative calendar for training sessions',
          type: 'calendar',
          createdBy: 'team-member-1',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          participants: [userId, 'team-member-1', 'team-member-2', 'team-member-3'],
          permissions: {
            [userId]: 'edit',
            'team-member-1': 'admin',
            'team-member-2': 'edit',
            'team-member-3': 'view'
          },
          isActive: true,
          version: 3,
          conflictResolution: 'last_write_wins'
        }
      ];

      setSharedWorkspaces(mockWorkspaces);

      // Initialize mock messages
      const mockMessages: CollaborationMessage[] = [
        {
          id: 'msg-1',
          senderId: 'team-member-1',
          senderName: 'Sarah Johnson',
          content: 'Hi everyone! Just uploaded the latest compliance requirements to the shared workspace.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'text',
          reactions: [
            { emoji: '👍', users: [userId, 'team-member-2'], count: 2 }
          ],
          isEdited: false,
          isDeleted: false
        },
        {
          id: 'msg-2',
          senderId: 'team-member-2',
          senderName: 'Michael Chen',
          content: 'Thanks Sarah! I\'ll review them after my training session.',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          type: 'text',
          reactions: [],
          isEdited: false,
          isDeleted: false
        },
        {
          id: 'msg-3',
          senderId: userId,
          senderName: 'Current User',
          content: 'Great work team! The compliance dashboard is looking much better.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          type: 'text',
          reactions: [
            { emoji: '🎉', users: ['team-member-1'], count: 1 }
          ],
          isEdited: false,
          isDeleted: false
        }
      ];

      setMessages(mockMessages);

    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setError('Failed to initialize team collaboration. Please try again.');
      toast.error('Failed to initialize collaboration');
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  // Real-time presence updates
  useEffect(() => {
    const channel = supabase
      .channel(`team-collaboration-${teamId || 'default'}`)
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        // Update team member status
        setTeamMembers(prev => prev.map(member => 
          member.id === key 
            ? { ...member, status: 'online', lastActive: new Date().toISOString() }
            : member
        ));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        // Update team member status
        setTeamMembers(prev => prev.map(member => 
          member.id === key 
            ? { ...member, status: 'offline', lastActive: new Date().toISOString() }
            : member
        ));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            name: 'Current User',
            status: userPresence,
            activity: userActivity,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, teamId, userPresence, userActivity]);

  // Load collaboration data on mount
  useEffect(() => {
    initializeCollaboration();
  }, [initializeCollaboration]);

  // Update user presence
  const updatePresence = useCallback(async (status: TeamMember['status'], activity?: string) => {
    setUserPresence(status);
    if (activity !== undefined) {
      setUserActivity(activity);
    }

    // Update in team members list
    setTeamMembers(prev => prev.map(member => 
      member.id === userId 
        ? { ...member, status, currentActivity: activity || member.currentActivity, lastActive: new Date().toISOString() }
        : member
    ));

    // Notify collaboration update
    if (onCollaborationUpdate) {
      onCollaborationUpdate({
        type: 'presence',
        data: { userId, status, activity },
        timestamp: new Date().toISOString(),
        userId
      });
    }
  }, [userId, onCollaborationUpdate]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    try {
      const message: CollaborationMessage = {
        id: `msg-${Date.now()}`,
        senderId: userId,
        senderName: 'Current User',
        content: newMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
        reactions: [],
        isEdited: false,
        isDeleted: false
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update activity
      updatePresence(userPresence, 'Chatting with team');

      // Notify collaboration update
      if (onCollaborationUpdate) {
        onCollaborationUpdate({
          type: 'message',
          data: message,
          timestamp: new Date().toISOString(),
          userId
        });
      }

      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  }, [newMessage, userId, userPresence, updatePresence, onCollaborationUpdate]);

  // Create workspace
  const createWorkspace = useCallback(async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    try {
      const workspace: SharedWorkspace = {
        id: `workspace-${Date.now()}`,
        name: newWorkspaceName,
        description: `${newWorkspaceType} workspace created by Current User`,
        type: newWorkspaceType,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        participants: [userId],
        permissions: {
          [userId]: 'admin'
        },
        isActive: true,
        version: 1,
        conflictResolution: 'merge'
      };

      setSharedWorkspaces(prev => [workspace, ...prev]);
      setNewWorkspaceName('');
      setNewWorkspaceType('document');
      setShowCreateWorkspace(false);

      // Update activity
      updatePresence(userPresence, `Created ${newWorkspaceType} workspace`);

      toast.success('Workspace created successfully');
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
    }
  }, [newWorkspaceName, newWorkspaceType, userId, userPresence, updatePresence]);

  // Start real-time session
  const startSession = useCallback(async (type: RealTimeSession['type']) => {
    try {
      const session: RealTimeSession = {
        id: `session-${Date.now()}`,
        type,
        participants: [userId],
        hostId: userId,
        startTime: new Date().toISOString(),
        isActive: true,
        settings: sessionSettings
      };

      setActiveSession(session);
      updatePresence('in_meeting', `In ${type} session`);

      toast.success(`${type} session started`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    }
  }, [userId, sessionSettings, updatePresence]);

  // End session
  const endSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      setActiveSession(prev => prev ? { ...prev, isActive: false, endTime: new Date().toISOString() } : null);
      updatePresence('online', 'Available');

      toast.success('Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    }
  }, [activeSession, updatePresence]);

  // Get status color
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'in_meeting': return 'bg-blue-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Get workspace type icon
  const getWorkspaceTypeIcon = (type: SharedWorkspace['type']) => {
    switch (type) {
      case 'document': return FileText;
      case 'whiteboard': return Edit;
      case 'kanban': return Square;
      case 'calendar': return Calendar;
      case 'file_manager': return Upload;
      default: return FileText;
    }
  };

  // Render team member card
  const renderTeamMemberCard = (member: TeamMember) => {
    const Icon = getWorkspaceTypeIcon('document');
    
    return (
      <Card key={member.id} className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
              getStatusColor(member.status)
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{member.name}</h4>
              <Badge variant="outline" className="text-xs">{member.role}</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
            
            {member.currentActivity && (
              <p className="text-xs text-muted-foreground mb-2">{member.currentActivity}</p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{member.timezone}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>Active {new Date(member.lastActive).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center gap-1 mt-2">
              {member.capabilities.map(capability => (
                <Badge 
                  key={capability.type} 
                  variant={capability.enabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {capability.type.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  };

  // Render workspace card
  const renderWorkspaceCard = (workspace: SharedWorkspace) => {
    const Icon = getWorkspaceTypeIcon(workspace.type);
    
    return (
      <Card key={workspace.id} className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{workspace.name}</h4>
              <Badge variant={workspace.isActive ? "default" : "secondary"}>
                {workspace.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{workspace.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{workspace.participants.length} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Modified {new Date(workspace.lastModified).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setSelectedWorkspace(workspace)}>
                <Eye className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Render message
  const renderMessage = (message: CollaborationMessage) => (
    <div key={message.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-md">
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.senderAvatar} />
        <AvatarFallback className="text-xs">
          {message.senderName.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{message.senderName}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.isEdited && (
            <Badge variant="outline" className="text-xs">Edited</Badge>
          )}
        </div>
        <p className="text-sm">{message.content}</p>
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <Badge key={index} variant="outline" className="text-xs cursor-pointer">
                {reaction.emoji} {reaction.count}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading collaboration platform...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Collaboration Platform</h2>
          <p className="text-muted-foreground">
            Real-time collaboration with team presence, shared workspaces, and communication
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Presence indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(userPresence))} />
            <span className="text-sm font-medium capitalize">{userPresence}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updatePresence('online')}>
                  <Circle className="h-4 w-4 mr-2 text-green-500" />
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updatePresence('busy')}>
                  <Circle className="h-4 w-4 mr-2 text-red-500" />
                  Busy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updatePresence('away')}>
                  <Circle className="h-4 w-4 mr-2 text-yellow-500" />
                  Away
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updatePresence('offline')}>
                  <Circle className="h-4 w-4 mr-2 text-gray-400" />
                  Offline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Session controls */}
          {activeSession ? (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse">
                Live {activeSession.type}
              </Badge>
              <Button size="sm" variant="destructive" onClick={endSession}>
                End Session
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => startSession('audio')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Audio Call
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startSession('video')}>
                  <Video className="h-4 w-4 mr-2" />
                  Video Call
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startSession('screen_share')}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Screen Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presence" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Workspaces ({sharedWorkspaces.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presence" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map(renderTeamMemberCard)}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-96">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Shared Workspaces</h3>
            <Button onClick={() => setShowCreateWorkspace(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>
          
          <div className="space-y-4">
            {sharedWorkspaces.map(renderWorkspaceCard)}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Active {activeSession.type} Session</h4>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(activeSession.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="destructive" className="animate-pulse">
                      Live
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{activeSession.participants.length}</div>
                      <div className="text-sm text-muted-foreground">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 60000)}
                      </div>
                      <div className="text-sm text-muted-foreground">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">HD</div>
                      <div className="text-sm text-muted-foreground">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {activeSession.settings.recordingEnabled ? 'ON' : 'OFF'}
                      </div>
                      <div className="text-sm text-muted-foreground">Recording</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a real-time collaboration session with your team
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => startSession('audio')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Audio Call
                    </Button>
                    <Button onClick={() => startSession('video')}>
                      <Video className="h-4 w-4 mr-2" />
                      Video Call
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workspace Dialog */}
      {showCreateWorkspace && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Workspace</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateWorkspace(false)}>
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {newWorkspaceType}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => setNewWorkspaceType('document')}>
                      Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewWorkspaceType('whiteboard')}>
                      Whiteboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewWorkspaceType('kanban')}>
                      Kanban
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewWorkspaceType('calendar')}>
                      Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewWorkspaceType('file_manager')}>
                      File Manager
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateWorkspace(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createWorkspace} className="flex-1">
                  Create
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}