import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Database,
  Shield,
  Users,
  Download,
  Plus,
  Filter
} from 'lucide-react';
import { ComplianceService, ComplianceMetric } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { supabase } from '@/integrations/supabase/client';

export function AdminSystemSettings() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ComplianceMetric | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ComplianceMetric>>({});
  
  // 🎯 NEW: Tier management state
  const [availableTiers, setAvailableTiers] = useState<string[]>(['basic', 'robust']);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isCreatingTier, setIsCreatingTier] = useState(false);
  const [newTierName, setNewTierName] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      // 🔧 FIX: Load ALL metrics including deactivated ones (is_active: false)
      const { data: allMetricsIncludingInactive, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .order('is_active', { ascending: false }) // Active first, then inactive
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      setMetrics(allMetricsIncludingInactive || []);
      
      // 🚨 CRITICAL FIX: Load tiers from compliance_tiers table
      const { data: tierData, error: tierError } = await supabase
        .from('compliance_tiers')
        .select('tier')
        .order('tier');
      
      if (tierError) {
        console.warn('Failed to load from compliance_tiers table, falling back to metrics:', tierError);
        // Fallback: Extract available tiers from metrics
        const tiers = new Set<string>();
        allMetricsIncludingInactive?.forEach(metric => {
          if (metric.applicable_tiers) {
            metric.applicable_tiers.split(',').forEach(tier => tiers.add(tier.trim()));
          }
        });
        setAvailableTiers(Array.from(tiers).sort());
      } else {
        // Use tiers from compliance_tiers table
        const uniqueTiers = Array.from(new Set((tierData || []).map(t => t.tier))).sort();
        setAvailableTiers(uniqueTiers);
        console.log('✅ Loaded tiers from compliance_tiers table:', uniqueTiers);
      }
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
      
      // Save the metric
      const savedMetric = await ComplianceService.upsertComplianceMetric(editForm);
      
      // 🔧 FIX: If this is a new metric (no selectedMetric), create compliance records for all existing users
      if (!selectedMetric && savedMetric.id) {
        console.log('🔧 Creating compliance records for new metric:', savedMetric.name);
        
        // Get all users
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, role');
        
        if (usersError) {
          console.error('Failed to fetch users:', usersError);
        } else if (users && users.length > 0) {
          // Filter users based on required_for_roles
          const applicableUsers = users.filter(user => {
            const requiredRoles = savedMetric.required_for_roles || [];
            return requiredRoles.length === 0 || requiredRoles.includes(user.role);
          });
          
          console.log(`🔧 Creating records for ${applicableUsers.length} applicable users`);
          
          // Create compliance records for applicable users
          const recordPromises = applicableUsers.map(user =>
            supabase
              .from('user_compliance_records')
              .upsert({
                user_id: user.id,
                metric_id: savedMetric.id,
                compliance_status: 'pending',
                current_value: null,
                last_checked_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,metric_id'
              })
          );
          
          await Promise.all(recordPromises);
          console.log('✅ Compliance records created for all applicable users');
        }
      }
      
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

  // 🔄 NEW: Reactivate deactivated compliance requirements
  const handleReactivateMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to reactivate this compliance requirement?')) return;

    try {
      const metric = metrics.find(m => m.id === metricId);
      if (!metric) return;

      await ComplianceService.upsertComplianceMetric({
        ...metric,
        is_active: true
      });
      await loadMetrics();
    } catch (error) {
      console.error('Failed to reactivate metric:', error);
    }
  };

  // 🎯 NEW: Tier management functions
  const exportTierRequirements = (tierName: string) => {
    const tierMetrics = metrics.filter(metric =>
      metric.applicable_tiers?.includes(tierName)
    );
    
    const exportData = {
      tier: tierName,
      exportDate: new Date().toISOString(),
      totalRequirements: tierMetrics.length,
      activeRequirements: tierMetrics.filter(m => m.is_active).length,
      requirements: tierMetrics.map(metric => ({
        name: metric.name,
        description: metric.description,
        category: metric.category,
        measurement_type: metric.measurement_type,
        weight: metric.weight,
        required_for_roles: metric.required_for_roles,
        is_active: metric.is_active,
        target_value: metric.target_value
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tierName}_compliance_requirements_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateTier = async () => {
    if (!newTierName.trim()) return;
    
    const tierName = newTierName.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (availableTiers.includes(tierName)) {
      alert('Tier already exists!');
      return;
    }
    
    try {
      setSaving(true);
      
      // 🚨 CRITICAL FIX: Create tier in compliance_tiers table for all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');
      
      if (usersError) throw usersError;
      
      if (users && users.length > 0) {
        // Create tier records for all users
        const tierRecords = users.map(user => ({
          user_id: user.id,
          tier: tierName,
          assigned_at: new Date().toISOString(),
          completed_requirements: 0,
          total_requirements: 0,
          completion_percentage: 0,
          last_updated: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('compliance_tiers')
          .insert(tierRecords);
        
        if (insertError) {
          console.error('Failed to create tier records:', insertError);
        } else {
          console.log('✅ Created tier for', users.length, 'users');
        }
      }
      
      setAvailableTiers([...availableTiers, tierName].sort());
      setNewTierName('');
      setIsCreatingTier(false);
    } catch (error) {
      console.error('Failed to create tier:', error);
      alert('Failed to create tier: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredMetrics = () => {
    if (selectedTier === 'all') return metrics;
    return metrics.filter(metric =>
      metric.applicable_tiers?.includes(selectedTier)
    );
  };

  const getMetricsByTier = () => {
    const metricsByTier: { [key: string]: ComplianceMetric[] } = {};
    
    availableTiers.forEach(tier => {
      metricsByTier[tier] = metrics.filter(metric =>
        metric.applicable_tiers?.includes(tier)
      );
    });
    
    // Add metrics that don't belong to any known tier
    const untieredMetrics = metrics.filter(metric =>
      !metric.applicable_tiers ||
      !availableTiers.some(tier => metric.applicable_tiers?.includes(tier))
    );
    
    if (untieredMetrics.length > 0) {
      metricsByTier['unassigned'] = untieredMetrics;
    }
    
    return metricsByTier;
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

      {/* Compliance Metrics Management - Tier-Based Organization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Metrics by Tier
              <Badge variant="outline">{metrics.length} total metrics</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreatingTier(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Create Tier
              </Button>
              <Button onClick={handleCreateNewMetric}>
                <Plus className="h-4 w-4 mr-1" />
                Create New Metric
              </Button>
            </div>
          </div>
          
          {/* Tier Controls */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {availableTiers.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTier !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTierRequirements(selectedTier)}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Tier Creation Modal */}
          {isCreatingTier && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-3">Create New Compliance Tier</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tier name (e.g., 'premium', 'enterprise')"
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateTier} disabled={!newTierName.trim()}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreatingTier(false);
                  setNewTierName('');
                }}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                New tiers can be used to organize compliance requirements for different organization types.
              </p>
            </div>
          )}

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
          ) : selectedTier === 'all' ? (
            // Display metrics organized by tiers using tabs
            <Tabs defaultValue={availableTiers[0]} className="w-full">
              <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${availableTiers.length}, 1fr)`}}>
                {availableTiers.map(tier => {
                  const tierMetrics = metrics.filter(m => m.applicable_tiers?.includes(tier));
                  return (
                    <TabsTrigger key={tier} value={tier} className="flex items-center gap-2">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      <Badge variant="secondary" className="text-xs">
                        {tierMetrics.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {availableTiers.map(tier => (
                <TabsContent key={tier} value={tier} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Requirements
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTierRequirements(tier)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Tier
                    </Button>
                  </div>
                  
                  {getMetricsByTier()[tier]?.map((metric) => (
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
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {tier}
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
                          {metric.is_active ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMetric(metric.id)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReactivateMetric(metric.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getMetricsByTier()[tier]?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No {tier} tier requirements</p>
                      <p className="text-sm">Create requirements specifically for the {tier} tier.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Display filtered metrics for selected tier
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier Requirements
                </h3>
                <Badge variant="outline">
                  {getFilteredMetrics().length} requirements
                </Badge>
              </div>
              
              {getFilteredMetrics().map((metric) => (
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
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {selectedTier}
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
                      {metric.is_active ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMetric(metric.id)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReactivateMetric(metric.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredMetrics().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No {selectedTier} tier metrics configured</p>
                  <p className="text-sm">Create your first {selectedTier} tier compliance metric.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}