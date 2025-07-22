import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Database,
  Shield,
  Users
} from 'lucide-react';
import { ComplianceService, ComplianceMetric } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';

export function AdminSystemSettings() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ComplianceMetric | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ComplianceMetric>>({});

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const allMetrics = await ComplianceService.getComplianceMetrics();
      setMetrics(allMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMetric = (metric: ComplianceMetric) => {
    setSelectedMetric(metric);
    setEditForm({
      ...metric,
      required_for_roles: metric.required_for_roles || []
    });
    setIsEditing(true);
  };

  const handleSaveMetric = async () => {
    if (!editForm.name) return;

    try {
      setSaving(true);
      await ComplianceService.upsertComplianceMetric(editForm);
      await loadMetrics();
      setIsEditing(false);
      setSelectedMetric(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to save metric:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewMetric = () => {
    setSelectedMetric(null);
    setEditForm({
      name: '',
      description: '',
      category: 'general',
      required_for_roles: [],
      measurement_type: 'boolean',
      target_value: true,
      weight: 1,
      is_active: true,
      applicable_tiers: 'basic,robust'
    });
    setIsEditing(true);
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to deactivate this metric?')) return;

    try {
      await ComplianceService.deleteComplianceMetric(metricId);
      await loadMetrics();
    } catch (error) {
      console.error('Failed to delete metric:', error);
    }
  };

  const initializeRequirements = async () => {
    try {
      setSaving(true);
      await ComplianceRequirementsService.initializeAllComplianceRequirements();
      await loadMetrics();
    } catch (error) {
      console.error('Failed to initialize requirements:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'training': 'bg-blue-100 text-blue-800',
      'certification': 'bg-green-100 text-green-800',
      'documentation': 'bg-yellow-100 text-yellow-800',
      'insurance': 'bg-purple-100 text-purple-800',
      'background': 'bg-red-100 text-red-800'
    };
    return colors[category] || colors['general'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={initializeRequirements}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {saving ? 'Initializing...' : 'Initialize All Requirements'}
            </Button>
            
            <Button
              onClick={loadMetrics}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System actions will affect all users. Use with caution in production environments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Compliance Metrics Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Metrics
              <Badge variant="outline">{metrics.length} metrics</Badge>
            </CardTitle>
            <Button onClick={handleCreateNewMetric}>
              Create New Metric
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">
                {selectedMetric ? 'Edit Metric' : 'Create New Metric'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Metric name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={editForm.category || 'general'}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="general">General</option>
                    <option value="training">Training</option>
                    <option value="certification">Certification</option>
                    <option value="documentation">Documentation</option>
                    <option value="insurance">Insurance</option>
                    <option value="background">Background Check</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Metric description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Measurement Type</label>
                  <select
                    value={editForm.measurement_type || 'boolean'}
                    onChange={(e) => setEditForm({...editForm, measurement_type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="boolean">Boolean</option>
                    <option value="percentage">Percentage</option>
                    <option value="date">Date</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight</label>
                  <Input
                    type="number"
                    value={editForm.weight || 1}
                    onChange={(e) => setEditForm({...editForm, weight: parseInt(e.target.value)})}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Applicable Tiers</label>
                  <select
                    value={editForm.applicable_tiers || 'basic,robust'}
                    onChange={(e) => setEditForm({...editForm, applicable_tiers: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="basic,robust">Both Tiers</option>
                    <option value="basic">Basic Only</option>
                    <option value="robust">Robust Only</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveMetric}
                  disabled={saving || !editForm.name}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save Metric'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedMetric(null);
                    setEditForm({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{metric.name}</h4>
                        <Badge variant="outline" className={getCategoryColor(metric.category)}>
                          {metric.category}
                        </Badge>
                        <Badge variant="outline">
                          {metric.measurement_type}
                        </Badge>
                        {metric.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {metric.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>Weight: {metric.weight}</span>
                        <span>Tiers: {metric.applicable_tiers}</span>
                        <span>Roles: {metric.required_for_roles?.join(', ') || 'All'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMetric(metric)}
                      >
                        Edit
                      </Button>
                      {metric.is_active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMetric(metric.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {metrics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No metrics configured</p>
                  <p className="text-sm">Create your first compliance metric to get started.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}