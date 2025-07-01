
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  AlertTriangle, 
  Clock, 
  Users,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { PageHeader } from '@/components/ui/PageHeader';

export const MaintenanceMode: React.FC = () => {
  const [message, setMessage] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  
  const {
    isMaintenanceMode,
    maintenanceConfig,
    enableMaintenanceMode,
    disableMaintenanceMode,
    updateMaintenanceMessage,
    isLoading
  } = useMaintenanceMode();

  const handleToggleMaintenanceMode = async () => {
    if (isMaintenanceMode) {
      await disableMaintenanceMode();
    } else {
      await enableMaintenanceMode(message, estimatedDuration);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Settings className="h-7 w-7 text-primary" />}
        title="Maintenance Mode"
        subtitle="Control system maintenance mode and user access"
      />

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMaintenanceMode ? (
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
              <div>
                <div className="font-medium">
                  {isMaintenanceMode ? 'Maintenance Mode Active' : 'System Online'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isMaintenanceMode 
                    ? `Started: ${new Date(maintenanceConfig?.startTime || '').toLocaleString()}`
                    : 'All services are operational'
                  }
                </div>
              </div>
            </div>
            <Badge 
              variant={isMaintenanceMode ? 'destructive' : 'default'}
              className="text-sm"
            >
              {isMaintenanceMode ? 'Maintenance' : 'Online'}
            </Badge>
          </div>

          {isMaintenanceMode && maintenanceConfig && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Message:</strong> {maintenanceConfig.message}
                  </div>
                  {maintenanceConfig.estimatedDuration && (
                    <div>
                      <strong>Estimated Duration:</strong> {maintenanceConfig.estimatedDuration}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Control */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-toggle" className="text-base">
                Enable Maintenance Mode
              </Label>
              <div className="text-sm text-muted-foreground">
                Restrict access to the system for maintenance
              </div>
            </div>
            <Switch
              id="maintenance-toggle"
              checked={isMaintenanceMode}
              onCheckedChange={handleToggleMaintenanceMode}
              disabled={isLoading}
            />
          </div>

          {!isMaintenanceMode && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  placeholder="Enter a message to display to users during maintenance..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-duration">Estimated Duration</Label>
                <input
                  id="estimated-duration"
                  type="text"
                  placeholder="e.g., 2 hours, 30 minutes"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isMaintenanceMode ? '0' : '24'}
            </div>
            <div className="text-sm text-muted-foreground">
              Currently online
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="font-medium">Uptime</span>
            </div>
            <div className="text-2xl font-bold mt-2">99.9%</div>
            <div className="text-sm text-muted-foreground">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Last Maintenance</span>
            </div>
            <div className="text-2xl font-bold mt-2">7d</div>
            <div className="text-sm text-muted-foreground">
              Days ago
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                duration: '45 minutes',
                reason: 'Database optimization',
                status: 'completed'
              },
              {
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                duration: '2 hours',
                reason: 'Security updates',
                status: 'completed'
              },
              {
                date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
                duration: '30 minutes',
                reason: 'System backup',
                status: 'completed'
              }
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{session.reason}</div>
                  <div className="text-sm text-muted-foreground">
                    {session.date.toLocaleDateString()} • {session.duration}
                  </div>
                </div>
                <Badge variant="outline">
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
