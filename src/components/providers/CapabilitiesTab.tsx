import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Award,
  Users,
  MapPin,
  Wrench,
  AlertCircle
} from 'lucide-react';

interface CapabilitiesTabProps {
  providerId: string;
  capabilities: any[];
  onCapabilitiesChange: () => void;
}

export function CapabilitiesTab({ providerId, capabilities, onCapabilitiesChange }: CapabilitiesTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCapability, setEditingCapability] = useState<any>(null);

  // Add capability mutation
  const addCapabilityMutation = useMutation({
    mutationFn: async (capabilityData: {
      courseCategory: string;
      certificationTypes: string[];
      maxTeamSize: number;
      locationRestrictions: string[];
      equipmentRequirements: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('provider_training_capabilities')
        .insert({
          assigned_ap_user_id: providerId, // Updated: AP user assignment
          course_category: capabilityData.courseCategory,
          certification_types: capabilityData.certificationTypes,
          max_team_size: capabilityData.maxTeamSize,
          location_restrictions: capabilityData.locationRestrictions,
          equipment_requirements: capabilityData.equipmentRequirements
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Training capability added successfully');
      setShowAddDialog(false);
      onCapabilitiesChange();
    },
    onError: (error: any) => {
      toast.error(`Failed to add capability: ${error.message}`);
    }
  });

  // Update capability mutation
  const updateCapabilityMutation = useMutation({
    mutationFn: async (capabilityData: {
      id: string;
      courseCategory: string;
      certificationTypes: string[];
      maxTeamSize: number;
      locationRestrictions: string[];
      equipmentRequirements: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('provider_training_capabilities')
        .update({
          course_category: capabilityData.courseCategory,
          certification_types: capabilityData.certificationTypes,
          max_team_size: capabilityData.maxTeamSize,
          location_restrictions: capabilityData.locationRestrictions,
          equipment_requirements: capabilityData.equipmentRequirements,
          updated_at: new Date().toISOString()
        })
        .eq('id', capabilityData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Training capability updated successfully');
      setEditingCapability(null);
      onCapabilitiesChange();
    },
    onError: (error: any) => {
      toast.error(`Failed to update capability: ${error.message}`);
    }
  });

  // Delete capability mutation
  const deleteCapabilityMutation = useMutation({
    mutationFn: async (capabilityId: string) => {
      const { error } = await supabase
        .from('provider_training_capabilities')
        .delete()
        .eq('id', capabilityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Training capability deleted successfully');
      onCapabilitiesChange();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete capability: ${error.message}`);
    }
  });

  const handleAddCapability = (formData: FormData) => {
    const courseCategory = formData.get('courseCategory') as string;
    const certificationTypesStr = formData.get('certificationTypes') as string;
    const maxTeamSize = parseInt(formData.get('maxTeamSize') as string) || 20;
    const locationRestrictionsStr = formData.get('locationRestrictions') as string;
    const equipmentRequirementsStr = formData.get('equipmentRequirements') as string;

    if (!courseCategory) {
      toast.error('Please fill in the course category');
      return;
    }

    const certificationTypes = certificationTypesStr
      .split(',')
      .map(type => type.trim())
      .filter(type => type.length > 0);

    const locationRestrictions = locationRestrictionsStr
      .split(',')
      .map(loc => loc.trim())
      .filter(loc => loc.length > 0);

    let equipmentRequirements = {};
    if (equipmentRequirementsStr) {
      try {
        equipmentRequirements = JSON.parse(equipmentRequirementsStr);
      } catch (e) {
        // If JSON parsing fails, treat as simple key-value pairs
        equipmentRequirements = { description: equipmentRequirementsStr };
      }
    }

    addCapabilityMutation.mutate({
      courseCategory,
      certificationTypes,
      maxTeamSize,
      locationRestrictions,
      equipmentRequirements
    });
  };

  const handleUpdateCapability = (formData: FormData) => {
    if (!editingCapability) return;

    const courseCategory = formData.get('courseCategory') as string;
    const certificationTypesStr = formData.get('certificationTypes') as string;
    const maxTeamSize = parseInt(formData.get('maxTeamSize') as string) || 20;
    const locationRestrictionsStr = formData.get('locationRestrictions') as string;
    const equipmentRequirementsStr = formData.get('equipmentRequirements') as string;

    if (!courseCategory) {
      toast.error('Please fill in the course category');
      return;
    }

    const certificationTypes = certificationTypesStr
      .split(',')
      .map(type => type.trim())
      .filter(type => type.length > 0);

    const locationRestrictions = locationRestrictionsStr
      .split(',')
      .map(loc => loc.trim())
      .filter(loc => loc.length > 0);

    let equipmentRequirements = {};
    if (equipmentRequirementsStr) {
      try {
        equipmentRequirements = JSON.parse(equipmentRequirementsStr);
      } catch (e) {
        equipmentRequirements = { description: equipmentRequirementsStr };
      }
    }

    updateCapabilityMutation.mutate({
      id: editingCapability.id,
      courseCategory,
      certificationTypes,
      maxTeamSize,
      locationRestrictions,
      equipmentRequirements
    });
  };

  const handleDeleteCapability = (capabilityId: string, courseCategory: string) => {
    if (confirm(`Are you sure you want to delete the "${courseCategory}" capability?`)) {
      deleteCapabilityMutation.mutate(capabilityId);
    }
  };

  const CapabilityForm = ({ capability, onSubmit, submitLabel }: {
    capability?: any;
    onSubmit: (formData: FormData) => void;
    submitLabel: string;
  }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit(formData);
    }} className="space-y-4">
      <div>
        <Label htmlFor="courseCategory">Course Category</Label>
        <Input
          name="courseCategory"
          placeholder="e.g., Safety Training, Technical Skills"
          defaultValue={capability?.course_category || ''}
          required
        />
      </div>

      <div>
        <Label htmlFor="certificationTypes">Certification Types (comma-separated)</Label>
        <Input
          name="certificationTypes"
          placeholder="e.g., First Aid, CPR, Workplace Safety"
          defaultValue={capability?.certification_types?.join(', ') || ''}
        />
      </div>

      <div>
        <Label htmlFor="maxTeamSize">Maximum Team Size</Label>
        <Input
          name="maxTeamSize"
          type="number"
          min="1"
          max="100"
          defaultValue={capability?.max_team_size || 20}
        />
      </div>

      <div>
        <Label htmlFor="locationRestrictions">Location Restrictions (comma-separated)</Label>
        <Input
          name="locationRestrictions"
          placeholder="e.g., Main Campus, Training Center A"
          defaultValue={capability?.location_restrictions?.join(', ') || ''}
        />
      </div>

      <div>
        <Label htmlFor="equipmentRequirements">Equipment Requirements (JSON format)</Label>
        <Textarea
          name="equipmentRequirements"
          placeholder='{"projector": true, "training_materials": true}'
          defaultValue={capability?.equipment_requirements ? JSON.stringify(capability.equipment_requirements, null, 2) : ''}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={addCapabilityMutation.isPending || updateCapabilityMutation.isPending}
          className="flex-1"
        >
          {(addCapabilityMutation.isPending || updateCapabilityMutation.isPending) ? 'Saving...' : submitLabel}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setShowAddDialog(false);
            setEditingCapability(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Training Capabilities</h3>
          <p className="text-sm text-muted-foreground">
            Manage provider training capabilities and requirements
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Capability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Training Capability</DialogTitle>
            </DialogHeader>
            <CapabilityForm 
              onSubmit={handleAddCapability}
              submitLabel="Add Capability"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Capabilities List */}
      {capabilities.length > 0 ? (
        <div className="grid gap-4">
          {capabilities.map((capability) => (
            <Card key={capability.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{capability.course_category}</h4>
                      
                      {capability.certification_types && capability.certification_types.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground mb-1">Certifications:</p>
                          <div className="flex flex-wrap gap-1">
                            {capability.certification_types.map((cert: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>Max team size: {capability.max_team_size}</span>
                        </div>
                        
                        {capability.location_restrictions && capability.location_restrictions.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{capability.location_restrictions.length} location(s)</span>
                          </div>
                        )}
                        
                        {capability.equipment_requirements && Object.keys(capability.equipment_requirements).length > 0 && (
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-muted-foreground" />
                            <span>Equipment required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCapability(capability)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCapability(capability.id, capability.course_category)}
                      disabled={deleteCapabilityMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Training Capabilities</h3>
          <p className="text-sm">
            No training capabilities have been defined for this provider.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Capability
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingCapability} onOpenChange={() => setEditingCapability(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Training Capability</DialogTitle>
          </DialogHeader>
          <CapabilityForm 
            capability={editingCapability}
            onSubmit={handleUpdateCapability}
            submitLabel="Update Capability"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}