import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Trash2,
  TestTube
} from 'lucide-react';
import { useCalendarSync } from '@/hooks/integration/useCalendarSync';
import { formatDistanceToNow } from 'date-fns';

export function CalendarSyncSetup() {
  const {
    integrations,
    conflicts,
    integrationsLoading,
    saveIntegration,
    removeIntegration,
    syncAvailability,
    testConnection,
    refreshToken,
    resolveConflict,
    isSaving,
    isRemoving,
    isSyncing,
    isTesting,
    isRefreshing,
    isResolving,
    getConflictCount,
    hasActiveIntegration
  } = useCalendarSync();

  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);

  const handleToggleSync = async (integrationId: string, enabled: boolean) => {
    await saveIntegration({
      id: integrationId,
      sync_enabled: enabled
    });
  };

  const handleConnectGoogle = () => {
    // Redirect to Google OAuth flow
    const clientId = 'your-google-client-id'; // This would come from env/config
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
    
    window.location.href = authUrl;
  };

  const handleConnectOutlook = () => {
    // Redirect to Microsoft OAuth flow
    const clientId = 'your-microsoft-client-id'; // This would come from env/config
    const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    const scope = 'https://graph.microsoft.com/calendars.readwrite';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'disabled':
        return <Badge variant="outline">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProviderIcon = (provider: string) => {
    // In a real implementation, you'd use proper provider icons
    return <Calendar className="h-4 w-4" />;
  };

  if (integrationsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading calendar integrations...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your external calendars to automatically sync availability and prevent conflicts.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Conflicts Alert */}
      {getConflictCount() > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {getConflictCount()} calendar conflicts that need attention.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setExpandedIntegration('conflicts')}
            >
              View conflicts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connect New Calendars */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Calendar</CardTitle>
          <CardDescription>
            Add new calendar integrations to sync your availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleConnectGoogle}
              disabled={hasActiveIntegration('google')}
              className="h-auto p-4 flex-col gap-2"
            >
              {getProviderIcon('google')}
              <span>Google Calendar</span>
              {hasActiveIntegration('google') && (
                <Badge variant="secondary" className="text-xs">Connected</Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleConnectOutlook}
              disabled={hasActiveIntegration('outlook')}
              className="h-auto p-4 flex-col gap-2"
            >
              {getProviderIcon('outlook')}
              <span>Outlook Calendar</span>
              {hasActiveIntegration('outlook') && (
                <Badge variant="secondary" className="text-xs">Connected</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Integrations */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Calendars</CardTitle>
            <CardDescription>
              Manage your connected calendar integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(integration.provider_type)}
                    <div>
                      <h4 className="font-medium capitalize">
                        {integration.provider_type} Calendar
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {integration.provider_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration.sync_status)}
                    <Switch
                      checked={integration.sync_enabled}
                      onCheckedChange={(enabled) => handleToggleSync(integration.id, enabled)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {integration.error_message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {integration.error_message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Last sync: {integration.last_sync_at 
                      ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                      : 'Never'
                    }
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(integration.id)}
                      disabled={isTesting}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncAvailability(integration.id)}
                      disabled={isSyncing || !integration.sync_enabled}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refreshToken(integration.id)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedIntegration(
                        expandedIntegration === integration.id ? null : integration.id
                      )}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeIntegration(integration.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Expanded Settings */}
                {expandedIntegration === integration.id && (
                  <div className="border-t pt-4 space-y-4">
                    <h5 className="font-medium">Sync Settings</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Sync availability blocks
                        </label>
                        <Switch
                          checked={(integration.sync_settings as any)?.sync_availability ?? true}
                          onCheckedChange={(checked) => saveIntegration({
                            id: integration.id,
                            sync_settings: {
                              ...(integration.sync_settings as any || {}),
                              sync_availability: checked
                            }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Auto-detect conflicts
                        </label>
                        <Switch
                          checked={(integration.sync_settings as any)?.sync_conflicts ?? true}
                          onCheckedChange={(checked) => saveIntegration({
                            id: integration.id,
                            sync_settings: {
                              ...(integration.sync_settings as any || {}),
                              sync_conflicts: checked
                            }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Auto-create events
                        </label>
                        <Switch
                          checked={(integration.sync_settings as any)?.auto_create_events ?? false}
                          onCheckedChange={(checked) => saveIntegration({
                            id: integration.id,
                            sync_settings: {
                              ...(integration.sync_settings as any || {}),
                              auto_create_events: checked
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conflicts Section */}
      {expandedIntegration === 'conflicts' && conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar Conflicts</CardTitle>
            <CardDescription>
              Resolve conflicts between your availability and external calendar events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{conflict.event_title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(conflict.event_start).toLocaleString()} - {new Date(conflict.event_end).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Conflict</Badge>
                </div>
                
                {conflict.conflict_data && (
                  <div className="text-sm text-muted-foreground">
                    <p>{JSON.stringify(conflict.conflict_data)}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict({ eventId: conflict.id, resolution: 'keep_external' })}
                    disabled={isResolving}
                  >
                    Keep External
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict({ eventId: conflict.id, resolution: 'keep_internal' })}
                    disabled={isResolving}
                  >
                    Keep Internal
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict({ eventId: conflict.id, resolution: 'merge' })}
                    disabled={isResolving}
                  >
                    Merge
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
