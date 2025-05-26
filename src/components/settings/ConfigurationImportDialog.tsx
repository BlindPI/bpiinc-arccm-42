
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { ConfigurationExport, ImportOptions } from '@/services/configuration/configurationManager';

interface ConfigurationImportDialogProps {
  onImport: (config: ConfigurationExport, options: ImportOptions) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ConfigurationImportDialog: React.FC<ConfigurationImportDialogDialogProps> = ({
  onImport,
  onCancel,
  isLoading
}) => {
  const [configData, setConfigData] = useState<ConfigurationExport | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    validateOnly: false
  });
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result) as ConfigurationExport;
        
        // Basic validation
        if (!data.version || !data.configurations || !Array.isArray(data.configurations)) {
          throw new Error('Invalid configuration file format');
        }
        
        setConfigData(data);
        setError(null);
      } catch (err: any) {
        setError(`Failed to parse configuration file: ${err.message}`);
        setConfigData(null);
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (configData) {
      onImport(configData, options);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="config-file">Configuration File</Label>
            <input
              id="config-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {configData && (
            <div className="space-y-3">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Configuration file loaded with {configData.configurations.length} settings
                  <br />
                  <small>Exported: {new Date(configData.timestamp).toLocaleString()}</small>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="overwrite">Overwrite Existing</Label>
                  <Switch
                    id="overwrite"
                    checked={options.overwriteExisting}
                    onCheckedChange={(checked) => 
                      setOptions({...options, overwriteExisting: checked})
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace existing configurations with imported values
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="validate">Validate Only</Label>
                  <Switch
                    id="validate"
                    checked={options.validateOnly}
                    onCheckedChange={(checked) => 
                      setOptions({...options, validateOnly: checked})
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Check if import would succeed without making changes
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!configData || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Importing...' : options.validateOnly ? 'Validate' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
