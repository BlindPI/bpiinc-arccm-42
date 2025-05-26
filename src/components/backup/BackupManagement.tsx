
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive, 
  Download, 
  Upload, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useBackupManagement } from '@/hooks/useBackupManagement';
import { PageHeader } from '@/components/ui/PageHeader';

export const BackupManagement: React.FC = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  const {
    backups,
    backupStatus,
    createBackup,
    restoreBackup,
    configureAutomatedBackup,
    isLoading
  } = useBackupManagement();

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await createBackup('Manual backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <HardDrive className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HardDrive className="h-7 w-7 text-primary" />}
        title="Backup Management"
        subtitle="Create, restore, and manage system backups"
        actions={
          <Button 
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </Button>
        }
      />

      {/* Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {backupStatus?.totalBackups || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {backupStatus?.lastBackup ? new Date(backupStatus.lastBackup).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-muted-foreground">Last Backup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatFileSize(backupStatus?.totalSize || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Backup Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Daily Automated Backups</div>
                    <div className="text-sm">
                      Scheduled at 2:00 AM UTC • Retention: 30 days
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" onClick={() => configureAutomatedBackup()}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups && backups.length > 0 ? (
              backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString()} • {formatFileSize(backup.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {backup.type}
                    </Badge>
                    {backup.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No backups found</h3>
                <p>Create your first backup to get started</p>
                <Button className="mt-4" onClick={handleCreateBackup}>
                  Create First Backup
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Backup Storage</span>
                <span>{formatFileSize(backupStatus?.totalSize || 0)} / 10 GB</span>
              </div>
              <Progress 
                value={((backupStatus?.totalSize || 0) / (10 * 1024 * 1024 * 1024)) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Backups are retained for 30 days. Older backups are automatically deleted.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
