import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Save,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import { toast } from 'sonner';

interface ProgressionTrigger {
  id: string;
  from_role: string;
  to_role: string;
  automation_rules: any;
  approval_required: boolean;
  min_hours_required?: number;
  created_at: string;
  updated_at: string;
}

export const ProgressionPathBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [newTrigger, setNewTrigger] = useState({
    from_role: '',
    to_role: '',
    min_hours_required: 0,
    approval_required: true,
    auto_approve_threshold: 80
  });

  // Fetch progression triggers
  const { data: triggers, isLoading } = useQuery({
    queryKey: ['progression-triggers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progression_triggers')
        .select('*')
        .order('from_role', { ascending: true });
      
      if (error) throw error;
      return data as ProgressionTrigger[];
    }
  });

  // Create new trigger
  const createTrigger = useMutation({
    mutationFn: async (trigger: typeof newTrigger) => {
      const { data, error } = await supabase
        .from('progression_triggers')
        .insert({
          from_role: trigger.from_role,
          to_role: trigger.to_role,
          min_hours_required: trigger.min_hours_required,
          approval_required: trigger.approval_required,
          automation_rules: {
            auto_approve_threshold: trigger.auto_approve_threshold,
            require_supervisor_approval: trigger.approval_required
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Progression trigger created successfully');
      queryClient.invalidateQueries({ queryKey: ['progression-triggers'] });
      setNewTrigger({
        from_role: '',
        to_role: '',
        min_hours_required: 0,
        approval_required: true,
        auto_approve_threshold: 80
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to create trigger: ${error.message}`);
    }
  });

  // Update trigger
  const updateTrigger = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProgressionTrigger> }) => {
      const { data, error } = await supabase
        .from('progression_triggers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Progression trigger updated successfully');
      queryClient.invalidateQueries({ queryKey: ['progression-triggers'] });
      setEditingTrigger(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update trigger: ${error.message}`);
    }
  });

  // Delete trigger
  const deleteTrigger = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('progression_triggers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Progression trigger deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['progression-triggers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete trigger: ${error.message}`);
    }
  });

  const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progression Path Builder</h1>
          <p className="text-muted-foreground">Configure automated role progression rules and requirements</p>
        </div>
      </div>

      {/* Create New Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Progression Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_role">From Role</Label>
              <Select 
                value={newTrigger.from_role} 
                onValueChange={(value) => setNewTrigger({...newTrigger, from_role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select starting role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="to_role">To Role</Label>
              <Select 
                value={newTrigger.to_role} 
                onValueChange={(value) => setNewTrigger({...newTrigger, to_role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min_hours">Minimum Teaching Hours</Label>
              <Input
                id="min_hours"
                type="number"
                value={newTrigger.min_hours_required}
                onChange={(e) => setNewTrigger({...newTrigger, min_hours_required: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="threshold">Auto-Approve Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                value={newTrigger.auto_approve_threshold}
                onChange={(e) => setNewTrigger({...newTrigger, auto_approve_threshold: parseInt(e.target.value) || 80})}
                placeholder="80"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={() => createTrigger.mutate(newTrigger)}
              disabled={!newTrigger.from_role || !newTrigger.to_role || createTrigger.isPending}
              className="w-full md:w-auto"
            >
              {createTrigger.isPending ? 'Creating...' : 'Create Progression Path'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Existing Progression Paths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!triggers || triggers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No progression paths configured yet. Create one above to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {ROLE_LABELS[trigger.from_role as keyof typeof ROLE_LABELS]}
                      </Badge>
                      <span>→</span>
                      <Badge variant="default">
                        {ROLE_LABELS[trigger.to_role as keyof typeof ROLE_LABELS]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTrigger(trigger.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTrigger.mutate(trigger.id)}
                        disabled={deleteTrigger.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Min Hours:</span> {trigger.min_hours_required || 0}
                    </div>
                    <div>
                      <span className="font-medium">Approval Required:</span> 
                      <Badge variant={trigger.approval_required ? "secondary" : "outline"} className="ml-2">
                        {trigger.approval_required ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Auto-Approve:</span> 
                      {trigger.automation_rules?.auto_approve_threshold || 'N/A'}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressionPathBuilder;
