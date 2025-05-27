import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigurationManager, SystemConfiguration } from '@/services/configuration/configurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Pencil, Save, XCircle } from 'lucide-react';

interface UpdateConfigRequest {
  category: string;
  key: string;
  value: any;
  reason?: string;
}

export const SystemConfigurationPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: configurations, isLoading } = useQuery({
    queryKey: ['system-configurations'],
    queryFn: () => ConfigurationManager.getAllConfigurations()
  });

  const { mutate: updateConfig } = useMutation({
    mutationFn: ({ category, key, value, reason }: UpdateConfigRequest) =>
      ConfigurationManager.updateConfiguration(category, key, value, user?.id || '', reason),
    onSuccess: () => {
      toast.success('Configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      setEditingConfig(null);
    }
  });

  // Initialize navigation configuration if it doesn't exist
  React.useEffect(() => {
    if (configurations) {
      const hasNavigationConfig = configurations.some(
        c => c.category === 'navigation' && c.key === 'visibility'
      );
      
      if (!hasNavigationConfig) {
        // Create default navigation configuration
        const defaultConfig = {
          SA: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: true, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: true, items: {} },
            'Compliance & Automation': { enabled: true, items: {} },
            'System Administration': { enabled: true, items: {} }
          },
          AD: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: true, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: true, items: {} },
            'Compliance & Automation': { enabled: true, items: {} },
            'System Administration': { enabled: false, items: {} }
          },
          AP: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: false, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: true, items: {} },
            'Compliance & Automation': { enabled: false, items: {} },
            'System Administration': { enabled: false, items: {} }
          },
          IC: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: false, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: false, items: {} },
            'Compliance & Automation': { enabled: false, items: {} },
            'System Administration': { enabled: false, items: {} }
          },
          IP: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: false, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: false, items: {} },
            'Compliance & Automation': { enabled: false, items: {} },
            'System Administration': { enabled: false, items: {} }
          },
          IT: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: false, items: {} },
            'Training Management': { enabled: true, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: false, items: {} },
            'Compliance & Automation': { enabled: false, items: {} },
            'System Administration': { enabled: false, items: {} }
          },
          IN: {
            'Dashboard': { enabled: true, items: {} },
            'User Management': { enabled: false, items: {} },
            'Training Management': { enabled: false, items: {} },
            'Certificates': { enabled: true, items: {} },
            'Analytics & Reports': { enabled: false, items: {} },
            'Compliance & Automation': { enabled: false, items: {} },
            'System Administration': { enabled: false, items: {} }
          }
        };
        
        updateConfig({
          category: 'navigation',
          key: 'visibility',
          value: defaultConfig,
          reason: 'Initialize default navigation visibility settings'
        });
      }
    }
  }, [configurations, updateConfig]);

  const configurationsByCategory = React.useMemo(() => {
    if (!configurations) return {};
    return configurations.reduce((acc: { [key: string]: SystemConfiguration[] }, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});
  }, [configurations]);

  const renderConfigurationValue = (config: SystemConfiguration) => {
    if (editingConfig?.id === config.id) {
      return (
        <EditConfigurationForm
          config={config}
          onSave={(value, reason) => {
            updateConfig({
              category: config.category,
              key: config.key,
              value: value,
              reason: reason || 'Updated system configuration'
            });
            setEditingConfig(null);
          }}
          onCancel={() => setEditingConfig(null)}
        />
      );
    }

    let displayValue = config.value;
    if (typeof config.value === 'object') {
      displayValue = JSON.stringify(config.value, null, 2);
    } else if (typeof config.value === 'boolean') {
      displayValue = config.value ? 'True' : 'False';
    }

    return (
      <div className="flex items-center justify-between">
        <div className="prose max-w-prose break-words">
          {displayValue}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingConfig(config)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return <p>Loading configurations...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Manage system-wide settings and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Select onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(configurationsByCategory).sort().map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && (
              <Table>
                <TableCaption>
                  Configurations in the {selectedCategory} category.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Key</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurationsByCategory[selectedCategory].map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.key}</TableCell>
                      <TableCell>
                        {renderConfigurationValue(config)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface EditConfigurationFormProps {
  config: SystemConfiguration;
  onSave: (value: any, reason?: string) => void;
  onCancel: () => void;
}

const EditConfigurationForm: React.FC<EditConfigurationFormProps> = ({ config, onSave, onCancel }) => {
  const [value, setValue] = useState<any>(config.value);
  const [reason, setReason] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(config.isPublic);
  const [requiresRestart, setRequiresRestart] = useState<boolean>(config.requiresRestart);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSave = () => {
    onSave(value, reason);
  };

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="value">Value</Label>
        {config.dataType === 'string' && (
          <Input
            id="value"
            value={value}
            onChange={handleChange}
          />
        )}
        {config.dataType === 'number' && (
          <Input
            id="value"
            type="number"
            value={value}
            onChange={handleChange}
          />
        )}
        {config.dataType === 'boolean' && (
          <Checkbox
            id="value"
            checked={value}
            onCheckedChange={(checked) => setValue(checked)}
          />
        )}
        {['object', 'array'].includes(config.dataType) && (
          <Textarea
            id="value"
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={handleChange}
            className="font-mono text-sm"
          />
        )}
      </div>
      <div>
        <Label htmlFor="reason">Reason for Change</Label>
        <Input
          id="reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="isPublic">Is Public</Label>
        <Switch
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="requiresRestart">Requires Restart</Label>
        <Switch
          id="requiresRestart"
          checked={requiresRestart}
          onCheckedChange={(checked) => setRequiresRestart(checked)}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>
          <XCircle className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};
