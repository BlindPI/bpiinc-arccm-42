
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  measurement_type: string;
  required_for_tiers: string[];
  is_active: boolean;
}

export function ComplianceTierRequirementsEditor() {
  const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: requirements, isLoading } = useQuery({
    queryKey: ['compliance-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as ComplianceRequirement[];
    }
  });

  const { mutate: saveRequirement } = useMutation({
    mutationFn: async (requirement: Partial<ComplianceRequirement>) => {
      if (requirement.id) {
        const { error } = await supabase
          .from('compliance_metrics')
          .update(requirement)
          .eq('id', requirement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compliance_metrics')
          .insert(requirement);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Requirement saved successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-requirements'] });
      setEditingRequirement(null);
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(`Failed to save requirement: ${error.message}`);
    }
  });

  const { mutate: deleteRequirement } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_metrics')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requirement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-requirements'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete requirement: ${error.message}`);
    }
  });

  const handleEdit = (requirement: ComplianceRequirement) => {
    setEditingRequirement({ ...requirement });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingRequirement({
      id: '',
      name: '',
      description: '',
      category: 'documentation',
      measurement_type: 'file_upload',
      required_for_tiers: ['basic'],
      is_active: true
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (editingRequirement) {
      saveRequirement(editingRequirement);
    }
  };

  const handleCancel = () => {
    setEditingRequirement(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Requirements Management</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requirements?.map((requirement) => (
              <div key={requirement.id} className="border rounded-lg p-4">
                {editingRequirement?.id === requirement.id ? (
                  <RequirementEditor
                    requirement={editingRequirement}
                    onChange={setEditingRequirement}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ) : (
                  <RequirementDisplay
                    requirement={requirement}
                    onEdit={() => handleEdit(requirement)}
                    onDelete={() => deleteRequirement(requirement.id)}
                  />
                )}
              </div>
            ))}

            {isCreating && editingRequirement && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <RequirementEditor
                  requirement={editingRequirement}
                  onChange={setEditingRequirement}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isCreating={true}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RequirementDisplay({ 
  requirement, 
  onEdit, 
  onDelete 
}: { 
  requirement: ComplianceRequirement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">{requirement.name}</h3>
          <Badge variant="outline">{requirement.category}</Badge>
          <Badge variant={requirement.is_active ? "default" : "secondary"}>
            {requirement.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{requirement.description}</p>
        <div className="flex gap-2">
          {requirement.required_for_tiers?.map((tier) => (
            <Badge key={tier} variant="outline" className="text-xs">
              {tier} tier
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RequirementEditor({ 
  requirement, 
  onChange, 
  onSave, 
  onCancel,
  isCreating = false
}: {
  requirement: ComplianceRequirement;
  onChange: (req: ComplianceRequirement) => void;
  onSave: () => void;
  onCancel: () => void;
  isCreating?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={requirement.name}
            onChange={(e) => onChange({ ...requirement, name: e.target.value })}
            placeholder="Requirement name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select
            value={requirement.category}
            onValueChange={(value) => onChange({ ...requirement, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={requirement.description}
          onChange={(e) => onChange({ ...requirement, description: e.target.value })}
          placeholder="Requirement description"
        />
      </div>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          {isCreating ? 'Create' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
