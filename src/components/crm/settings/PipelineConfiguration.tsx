import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Settings,
  Target,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { crmSettingsService } from '@/services/crm/crmSettingsService';
import type { PipelineStage } from '@/types/crm';

// Validation schema
const pipelineStageSchema = z.object({
  stage_name: z.string().min(1, 'Stage name is required'),
  stage_description: z.string().optional(),
  stage_order: z.number().min(1, 'Stage order must be at least 1'),
  probability_percentage: z.number().min(0).max(100, 'Probability must be between 0 and 100'),
  is_active: z.boolean(),
  stage_color: z.string().optional(),
});

type PipelineStageFormData = z.infer<typeof pipelineStageSchema>;

interface PipelineConfigurationProps {
  showHeader?: boolean;
}

export function PipelineConfiguration({ showHeader = true }: PipelineConfigurationProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  const queryClient = useQueryClient();

  const form = useForm<PipelineStageFormData>({
    resolver: zodResolver(pipelineStageSchema),
    defaultValues: {
      is_active: true,
      probability_percentage: 50,
      stage_order: 1,
      stage_color: '#3b82f6'
    }
  });

  // Fetch pipeline stages
  const { data: stagesData, isLoading } = useQuery({
    queryKey: ['crm', 'pipeline-stages'],
    queryFn: async () => {
      const result = await crmSettingsService.getPipelineStages();
      return result.success ? result.data : [];
    },
  });

  // Create stage mutation
  const createStageMutation = useMutation({
    mutationFn: async (stageData: PipelineStageFormData) => {
      const result = await crmSettingsService.createPipelineStage(stageData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'pipeline-stages'] });
      setIsCreateDialogOpen(false);
      setEditingStage(null);
      form.reset();
    },
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PipelineStage> }) => {
      const result = await crmSettingsService.updatePipelineStage(id, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'pipeline-stages'] });
      setEditingStage(null);
      form.reset();
    },
  });

  // Delete stage mutation
  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const result = await crmSettingsService.deletePipelineStage(stageId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'pipeline-stages'] });
    },
  });

  const stages = stagesData || [];

  const onSubmit = (data: PipelineStageFormData) => {
    if (editingStage) {
      updateStageMutation.mutate({
        id: editingStage.id,
        updates: data
      });
    } else {
      createStageMutation.mutate(data);
    }
  };

  const handleEdit = (stage: PipelineStage) => {
    setEditingStage(stage);
    form.reset({
      stage_name: stage.stage_name,
      stage_description: stage.stage_description || '',
      stage_order: stage.stage_order,
      probability_percentage: stage.probability_percentage,
      is_active: stage.is_active,
      stage_color: stage.stage_color || '#3b82f6'
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (stageId: string) => {
    if (confirm('Are you sure you want to delete this pipeline stage? This action cannot be undone.')) {
      deleteStageMutation.mutate(stageId);
    }
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    const newOrder = direction === 'up' ? stage.stage_order - 1 : stage.stage_order + 1;
    
    // Find stage at target position
    const targetStage = stages.find(s => s.stage_order === newOrder);
    
    if (targetStage) {
      // Swap orders
      updateStageMutation.mutate({
        id: stage.id,
        updates: { stage_order: newOrder }
      });
      updateStageMutation.mutate({
        id: targetStage.id,
        updates: { stage_order: stage.stage_order }
      });
    }
  };

  const getStageStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pipeline Configuration</h2>
            <p className="text-gray-600">Manage your sales pipeline stages and probabilities</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStage ? 'Edit Pipeline Stage' : 'Create New Pipeline Stage'}
                </DialogTitle>
                <DialogDescription>
                  {editingStage 
                    ? 'Update the pipeline stage details and settings'
                    : 'Add a new stage to your sales pipeline'
                  }
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stage_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter stage name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage_order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Order *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Order in which this stage appears in the pipeline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="stage_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this stage represents..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="probability_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Probability % *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="50" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Default win probability for opportunities in this stage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Color</FormLabel>
                          <div className="space-y-3">
                            <FormControl>
                              <Input 
                                type="color" 
                                {...field}
                                className="w-full h-10"
                              />
                            </FormControl>
                            <div className="flex gap-2">
                              {predefinedColors.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                />
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Stage</FormLabel>
                          <FormDescription>
                            Enable this stage for use in the sales pipeline
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingStage(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createStageMutation.isPending || updateStageMutation.isPending}
                    >
                      {createStageMutation.isPending || updateStageMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {editingStage ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingStage ? 'Update Stage' : 'Create Stage'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Pipeline Stages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline Stages
          </CardTitle>
          <CardDescription>
            Configure the stages in your sales pipeline and their default probabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Stage Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages
                .sort((a, b) => a.stage_order - b.stage_order)
                .map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.stage_order}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleMoveStage(stage.id, 'up')}
                            disabled={stage.stage_order === 1}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleMoveStage(stage.id, 'down')}
                            disabled={stage.stage_order === stages.length}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{stage.stage_name}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {stage.stage_description || 'No description'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{stage.probability_percentage}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: stage.stage_color || '#3b82f6' }}
                        />
                        <span className="text-xs text-gray-500">
                          {stage.stage_color || '#3b82f6'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageStatusColor(stage.is_active)}>
                        {stage.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(stage)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(stage.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {stages.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pipeline stages configured</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first pipeline stage
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Stage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pipeline Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Stage Configuration Tips</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Keep stages clear and distinct from each other</li>
                <li>• Use probability percentages that reflect reality</li>
                <li>• Limit to 5-7 stages for optimal management</li>
                <li>• Order stages logically from initial contact to close</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Probability Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Qualified Lead: 10-20%</li>
                <li>• Needs Analysis: 25-40%</li>
                <li>• Proposal Sent: 50-70%</li>
                <li>• Negotiation: 75-90%</li>
                <li>• Closed Won: 100%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}