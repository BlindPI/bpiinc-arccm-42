
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PipelineManagementService } from '@/services/crm/pipelineManagementService';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';

export const PipelineStageManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => PipelineManagementService.getPipelineStages()
  });

  const createStageMutation = useMutation({
    mutationFn: PipelineManagementService.createPipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      setIsCreateDialogOpen(false);
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      PipelineManagementService.updatePipelineStage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      setEditingStage(null);
    }
  });

  const deleteStageMutation = useMutation({
    mutationFn: PipelineManagementService.deletePipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    }
  });

  const handleCreateStage = (data: any) => {
    createStageMutation.mutate(data);
  };

  const handleUpdateStage = (data: any) => {
    if (editingStage) {
      updateStageMutation.mutate({ id: editingStage.id, updates: data });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stage Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline Stage Manager</h2>
          <p className="text-muted-foreground">
            Manage your sales pipeline stages and their properties
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pipeline Stage</DialogTitle>
              <DialogDescription>
                Add a new stage to your sales pipeline
              </DialogDescription>
            </DialogHeader>
            <StageForm onSubmit={handleCreateStage} isLoading={createStageMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>
            Current pipeline stages in order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <h3 className="font-medium">{stage.stage_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stage.stage_description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {stage.stage_probability}% probability
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingStage(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteStageMutation.mutate(stage.id)}
                    disabled={deleteStageMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pipeline Stage</DialogTitle>
            <DialogDescription>
              Update the stage properties
            </DialogDescription>
          </DialogHeader>
          {editingStage && (
            <StageForm
              stage={editingStage}
              onSubmit={handleUpdateStage}
              isLoading={updateStageMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stage Form Component
interface StageFormProps {
  stage?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const StageForm: React.FC<StageFormProps> = ({ stage, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    stage_name: stage?.stage_name || '',
    stage_description: stage?.stage_description || '',
    stage_probability: stage?.stage_probability || 50,
    stage_order: stage?.stage_order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stage_name">Stage Name</Label>
        <Input
          id="stage_name"
          value={formData.stage_name}
          onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
          placeholder="Enter stage name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage_description">Description</Label>
        <Input
          id="stage_description"
          value={formData.stage_description}
          onChange={(e) => setFormData({ ...formData, stage_description: e.target.value })}
          placeholder="Enter stage description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stage_probability">Probability (%)</Label>
          <Input
            id="stage_probability"
            type="number"
            min="0"
            max="100"
            value={formData.stage_probability}
            onChange={(e) => setFormData({ ...formData, stage_probability: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage_order">Order</Label>
          <Input
            id="stage_order"
            type="number"
            min="1"
            value={formData.stage_order}
            onChange={(e) => setFormData({ ...formData, stage_order: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : stage ? 'Update Stage' : 'Create Stage'}
        </Button>
      </div>
    </form>
  );
};
