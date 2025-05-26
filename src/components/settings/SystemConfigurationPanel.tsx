
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Download, 
  Upload, 
  Save, 
  AlertTriangle,
  Lock,
  Globe
} from 'lucide-react';
import { useConfigurationManager } from '@/hooks/useConfigurationManager';
import { SystemConfiguration } from '@/services/configuration/configurationManager';
import { ConfigurationEditModal } from './ConfigurationEditModal';
import { ConfigurationImportDialog } from './ConfigurationImportDialog';

export const SystemConfigurationPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { 
    configurations, 
    isLoading, 
    updateConfig, 
    exportConfig, 
    importConfig 
  } = useConfigurationManager();

  const configurationsByCategory = useMemo(() => {
    return configurations?.reduce((acc, config) => {
      if (!acc[config.category]) acc[config.category] = [];
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, SystemConfiguration[]>);
  }, [configurations]);

  const handleExportConfig = () => {
    exportConfig.mutate();
  };

  const handleImportConfig = () => {
    setShowImportDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Settings className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground">Manage system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportConfig} disabled={exportConfig.isPending}>
            <Download className="h-4 w-4 mr-2" />
            {exportConfig.isPending ? 'Exporting...' : 'Export'}
          </Button>
          <Button variant="outline" onClick={handleImportConfig}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {Object.keys(configurationsByCategory || {}).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Configuration List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedCategory ? `${selectedCategory} Configuration` : 'Select Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCategory && configurationsByCategory?.[selectedCategory] ? (
              <div className="space-y-4">
                {configurationsByCategory[selectedCategory].map((config) => (
                  <ConfigurationItem
                    key={`${config.category}-${config.key}`}
                    configuration={config}
                    onEdit={setEditingConfig}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a category to view its configurations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Configuration Modal */}
      {editingConfig && (
        <ConfigurationEditModal
          configuration={editingConfig}
          onSave={(value, reason) => updateConfig.mutate({
            category: editingConfig.category,
            key: editingConfig.key,
            value,
            reason
          })}
          onCancel={() => setEditingConfig(null)}
          isLoading={updateConfig.isPending}
        />
      )}

      {/* Import Configuration Dialog */}
      {showImportDialog && (
        <ConfigurationImportDialog
          onImport={(config, options) => importConfig.mutate({ config, options })}
          onCancel={() => setShowImportDialog(false)}
          isLoading={importConfig.isPending}
        />
      )}
    </div>
  );
};

interface ConfigurationItemProps {
  configuration: SystemConfiguration;
  onEdit: (config: SystemConfiguration) => void;
}

const ConfigurationItem: React.FC<ConfigurationItemProps> = ({ configuration, onEdit }) => {
  const getValueDisplay = (value: any, dataType: string) => {
    switch (dataType) {
      case 'boolean':
        return value ? 'Enabled' : 'Disabled';
      case 'object':
      case 'array':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{configuration.key}</h4>
            <div className="flex gap-1">
              {!configuration.isPublic && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              {configuration.isPublic && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              {configuration.requiresRestart && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Restart Required
                </Badge>
              )}
            </div>
          </div>
          
          {configuration.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {configuration.description}
            </p>
          )}
          
          <div className="text-sm">
            <span className="font-medium">Value: </span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {getValueDisplay(configuration.value, configuration.dataType)}
            </code>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(configuration)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>
  );
};
