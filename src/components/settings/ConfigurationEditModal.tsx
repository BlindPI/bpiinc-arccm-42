
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertTriangle } from 'lucide-react';
import { SystemConfiguration } from '@/services/configuration/configurationManager';

interface ConfigurationEditModalProps {
  configuration: SystemConfiguration;
  onSave: (value: any, reason?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ConfigurationEditModal: React.FC<ConfigurationEditModalProps> = ({
  configuration,
  onSave,
  onCancel,
  isLoading
}) => {
  const [value, setValue] = useState<any>(configuration.value);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(configuration.value);
  }, [configuration]);

  const handleSave = () => {
    try {
      let parsedValue = value;
      
      // Parse the value based on data type
      switch (configuration.dataType) {
        case 'number':
          parsedValue = Number(value);
          if (isNaN(parsedValue)) {
            throw new Error('Invalid number format');
          }
          break;
        case 'boolean':
          parsedValue = Boolean(value);
          break;
        case 'object':
        case 'array':
          if (typeof value === 'string') {
            parsedValue = JSON.parse(value);
          }
          break;
        case 'string':
        default:
          parsedValue = String(value);
          break;
      }

      setError(null);
      onSave(parsedValue, reason || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderValueInput = () => {
    switch (configuration.dataType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={setValue}
            />
            <Label>{Boolean(value) ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a number"
          />
        );

      case 'object':
      case 'array':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter valid JSON"
            className="font-mono"
            rows={6}
          />
        );

      case 'string':
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a value"
          />
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Configuration</Label>
            <p className="text-sm text-muted-foreground">
              {configuration.category}.{configuration.key}
            </p>
          </div>

          {configuration.description && (
            <div>
              <Label className="font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                {configuration.description}
              </p>
            </div>
          )}

          <div>
            <Label className="font-medium">Value ({configuration.dataType})</Label>
            {renderValueInput()}
          </div>

          <div>
            <Label htmlFor="reason">Change Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe why you're making this change"
            />
          </div>

          {configuration.requiresRestart && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This configuration requires a system restart to take effect.
              </AlertDescription>
            </Alert>
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
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
