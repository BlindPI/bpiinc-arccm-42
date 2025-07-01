
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface ComplianceMetric {
  id: string;
  name: string;
  category: string;
  measurement_type: string;
  description?: string;
  required_for_basic: boolean;
  required_for_robust: boolean;
}

export function ComplianceTierRequirementsEditor() {
  const [editingMetric, setEditingMetric] = useState<ComplianceMetric | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as ComplianceMetric[];
    }
  });

  const { mutate: updateMetric } = useMutation({
    mutationFn: async (metric: ComplianceMetric) => {
      const { error } = await supabase
        .from('compliance_metrics')
        .update({
          name: metric.name,
          category: metric.category,
          measurement_type: metric.measurement_type,
          description: metric.description,
          required_for_basic: metric.required_for_basic,
          required_for_robust: metric.required_for_robust,
          updated_at: new Date().toISOString()
        })
        .eq('id', metric.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requirement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      setEditingMetric(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to save requirement: ${error.message}`);
    }
  });

  const { mutate: createMetric } = useMutation({
    mutationFn: async (metric: Omit<ComplianceMetric, 'id'>) => {
      const { error } = await supabase
        .from('compliance_metrics')
        .insert([metric]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requirement created successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create requirement: ${error.message}`);
    }
  });

  const { mutate: deleteMetric } = useMutation({
    mutationFn: async (metricId: string) => {
      const { error } = await supabase
        .from('compliance_metrics')
        .delete()
        .eq('id', metricId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requirement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete requirement: ${error.message}`);
    }
  });

  const handleSaveMetric = (metric: ComplianceMetric) => {
    updateMetric(metric);
  };

  const handleCreateMetric = () => {
    const newMetric = {
      name: 'New Requirement',
      category: 'general',
      measurement_type: 'document_review',
      description: '',
      required_for_basic: false,
      required_for_robust: false
    };
    createMetric(newMetric);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, ComplianceMetric[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Requirements Editor</h2>
          <p className="text-muted-foreground">
            Configure requirements for Basic and Robust compliance tiers
          </p>
        </div>
        <Button onClick={handleCreateMetric}>
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      </div>

      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category} Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryMetrics.map((metric) => (
                <div key={metric.id} className="border rounded-lg p-4">
                  {editingMetric?.id === metric.id ? (
                    <EditMetricForm
                      metric={editingMetric}
                      onSave={handleSaveMetric}
                      onCancel={() => setEditingMetric(null)}
                      onChange={setEditingMetric}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{metric.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {metric.measurement_type}
                          </Badge>
                        </div>
                        {metric.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {metric.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Basic Tier:</span>
                            <Badge variant={metric.required_for_basic ? "default" : "secondary"}>
                              {metric.required_for_basic ? "Required" : "Optional"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Robust Tier:</span>
                            <Badge variant={metric.required_for_robust ? "default" : "secondary"}>
                              {metric.required_for_robust ? "Required" : "Optional"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMetric(metric)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMetric(metric.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface EditMetricFormProps {
  metric: ComplianceMetric;
  onSave: (metric: ComplianceMetric) => void;
  onCancel: () => void;
  onChange: (metric: ComplianceMetric) => void;
}

function EditMetricForm({ metric, onSave, onCancel, onChange }: EditMetricFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={metric.name}
            onChange={(e) => onChange({ ...metric, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Input
            value={metric.category}
            onChange={(e) => onChange({ ...metric, category: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={metric.description || ''}
          onChange={(e) => onChange({ ...metric, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={metric.required_for_basic}
            onCheckedChange={(checked) => 
              onChange({ ...metric, required_for_basic: checked })
            }
          />
          <label className="text-sm font-medium">Required for Basic Tier</label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={metric.required_for_robust}
            onCheckedChange={(checked) => 
              onChange({ ...metric, required_for_robust: checked })
            }
          />
          <label className="text-sm font-medium">Required for Robust Tier</label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => onSave(metric)}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
