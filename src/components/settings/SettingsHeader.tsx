
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Upload, Activity, RefreshCw } from 'lucide-react';
import { useConfigurationManager } from '@/hooks/useConfigurationManager';

export const SettingsHeader: React.FC = () => {
  const { exportConfig, isLoading } = useConfigurationManager();

  const handleExport = () => {
    exportConfig.mutate();
  };

  const handleSystemCheck = () => {
    // System health check functionality
    console.log('Running system health check...');
  };

  return (
    <PageHeader
      icon={<Settings className="h-8 w-8 text-primary" />}
      title="System Settings"
      subtitle="Configure and manage your training management system"
      badge={{
        text: "Administrator",
        variant: "success"
      }}
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSystemCheck}
            className="hidden sm:flex"
          >
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportConfig.isPending}
            className="hidden sm:flex"
          >
            {exportConfig.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      }
      className="mb-6"
    />
  );
};
