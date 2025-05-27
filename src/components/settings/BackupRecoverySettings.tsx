import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Download, 
  Upload, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackupRecord {
  id: string;
  name: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  size: number;
  created_at: string;
  download_url?: string;
}

interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  retention_days: number;
  include_audit_logs: boolean;
  include_certificates: boolean;
}

export const BackupRecoverySettings: React.FC = () => {
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockBackups: BackupRecord[] = [
    {
      id: '1',
      name: 'Daily_Backup_2024_01_15',
      type: 'automatic',
      status: 'completed',
      size: 156.7,
      created_at: '2024-01-15T08:00:00Z',
      download_url: '#'
    },
    {
      id: '2',
      name: 'Manual_Backup_2024_01_14',
      type: 'manual',
      status: 'completed',
      size: 142.3,
      created_at: '2024-01-14T14:30:00Z',
      download_url: '#'
    },
    {
      id: '3',
      name: 'Daily_Backup_2024_01_13',
      type: 'automatic',
      status: 'failed',
      size: 0,
      created_at: '2024-01-13T08:00:00Z'
    }
  ];

  const defaultSettings: BackupSettings = {
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    backup_time: '08:00',
    retention_days: 30,
    include_audit_logs: true,
    include_certificates: true
  };

  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);

  const { data: backups = mockBackups, isLoading } = useQuery({
    queryKey: ['backup-records'],
    queryFn: async () => {
      // This would typically fetch from a backup_records table
      return mockBackups;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: BackupSettings) => {
      // This would typically update system_configurations
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          category: 'backup',
          key: 'settings',
          value: newSettings as any,
          data_type: 'object'
        }, { onConflict: 'category,key' });

      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      toast.success('Backup settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['backup-settings'] });
    }
  });

  const createBackup = useMutation({
    mutationFn: async () => {
      setIsBackingUp(true);
      setBackupProgress(0);

      // Simulate backup progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsBackingUp(false);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // This would typically call a backup edge function
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return {
        id: Date.now().toString(),
        name: `Manual_Backup_${new Date().toISOString().split('T')[0]}`,
        type: 'manual' as const,
        status: 'completed' as const,
        size: Math.random() * 200,
        created_at: new Date().toISOString()
      };
    },
    onSuccess: () => {
      toast.success('Backup created successfully');
      queryClient.invalidateQueries({ queryKey: ['backup-records'] });
      setBackupProgress(0);
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes;
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Backup & Recovery Settings</h2>
        <p className="text-muted-foreground">Manage system backups and data protection</p>
      </div>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic backup schedules and data inclusion settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-backup">Automatic Backups</Label>
                <Switch
                  id="auto-backup"
                  checked={settings.auto_backup_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_backup_enabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="frequency">Backup Frequency</Label>
                <Select 
                  value={settings.backup_frequency} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                    setSettings({ ...settings, backup_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="retention">Retention Period (Days)</Label>
                <Select 
                  value={settings.retention_days.toString()} 
                  onValueChange={(value) => setSettings({ ...settings, retention_days: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-certificates">Include Certificates</Label>
                <Switch
                  id="include-certificates"
                  checked={settings.include_certificates}
                  onCheckedChange={(checked) => setSettings({ ...settings, include_certificates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-audit">Include Audit Logs</Label>
                <Switch
                  id="include-audit"
                  checked={settings.include_audit_logs}
                  onCheckedChange={(checked) => setSettings({ ...settings, include_audit_logs: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => updateSettings.mutate(settings)}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an immediate backup of your system data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBackingUp && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backup Progress</span>
                <span className="text-sm text-muted-foreground">{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}

          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Manual backups may take several minutes depending on your data size. 
              The backup will include all selected data types from your configuration.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => createBackup.mutate()}
            disabled={createBackup.isPending || isBackingUp}
          >
            {isBackingUp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Create Backup Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>
            View and manage your backup files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(backup.status)}
                  <div>
                    <div className="font-medium">{backup.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(backup.created_at).toLocaleString()} • {formatFileSize(backup.size)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={backup.type === 'automatic' ? 'default' : 'secondary'}>
                    {backup.type}
                  </Badge>
                  {backup.status === 'completed' && backup.download_url && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
