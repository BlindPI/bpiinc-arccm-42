
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  RefreshCw,
  X
} from 'lucide-react';
import { SystemConfiguration } from '@/services/configuration/configurationManager';
import { ConfigurationEditModal } from '../ConfigurationEditModal';
import { useConfigurationManager } from '@/hooks/useConfigurationManager';
import { toast } from 'sonner';

interface ConfigurationDetailModalProps {
  configuration: SystemConfiguration;
  onClose: () => void;
  categoryColor: string;
}

export const ConfigurationDetailModal: React.FC<ConfigurationDetailModalProps> = ({
  configuration,
  onClose,
  categoryColor
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { updateConfig } = useConfigurationManager();

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      amber: 'text-amber-600 bg-amber-50 border-amber-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const handleSave = (value: any, reason?: string) => {
    updateConfig.mutate({
      category: configuration.category,
      key: configuration.key,
      value,
      reason
    });
    setShowEditModal(false);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                Configuration Details
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Configuration Header */}
            <Card className={`border-2 ${getColorClasses(categoryColor)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {configuration.category}.{configuration.key}
                    </CardTitle>
                    {configuration.description && (
                      <p className="text-gray-600 mt-1">
                        {configuration.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={configuration.isPublic ? "default" : "secondary"}>
                    {configuration.isPublic ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Data Type</span>
                    <p className="text-gray-900 font-mono">{configuration.dataType}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <p className="text-gray-900">{configuration.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Value */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Value</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(formatValue(configuration.value))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {formatValue(configuration.value)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {configuration.requiresRestart ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">Restart Required</span>
                    </div>
                    <Badge variant={configuration.requiresRestart ? "destructive" : "secondary"}>
                      {configuration.requiresRestart ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {configuration.isPublic ? (
                        <Eye className="h-4 w-4 text-blue-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium">Public Visibility</span>
                    </div>
                    <Badge variant={configuration.isPublic ? "default" : "secondary"}>
                      {configuration.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Rules */}
            {configuration.validationRules && configuration.validationRules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {configuration.validationRules.map((rule, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">{rule.type}</div>
                        <div className="text-sm text-yellow-700">{rule.message}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning Messages */}
            {configuration.requiresRestart && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      System restart required for changes to take effect
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {showEditModal && (
        <ConfigurationEditModal
          configuration={configuration}
          onSave={handleSave}
          onCancel={() => setShowEditModal(false)}
          isLoading={updateConfig.isPending}
        />
      )}
    </>
  );
};
