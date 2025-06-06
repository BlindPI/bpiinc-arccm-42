import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PipelineStageService, PipelineStage, PipelineMetrics } from '@/services/crm/pipelineStageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Palette
} from 'lucide-react';

interface PipelineStageManagerProps {
  className?: string;
}

export const PipelineStageManager: React.FC<PipelineStageManagerProps> = ({ className }) => {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stages');

  const queryClient = useQueryClient();

  // Fetch pipeline stages
  const { data: stages = [], isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => PipelineStageService.getPipelineStages()
  });

  // Fetch pipeline metrics
  const { data: metrics = [], isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: PipelineStageService.getPipelineMetrics
  });

  // Fetch performance summary
  const { data: performanceSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['stage-performance-summary'],
    queryFn: PipelineStageService.getStagePerformanceSummary
  });

  // Create stage mutation
  const createStageMutation = useMutation({
    mutationFn: PipelineStageService.createPipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] });
      setIsCreateDialogOpen(false);
    }
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PipelineStage> }) =>
      PipelineStageService.updatePipelineStage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] });
      setIsEditDialogOpen(false);
      setSelectedStage(null);
    }
  });

  // Delete stage mutation
  const deleteStageMutation = useMutation({
    mutationFn: PipelineStageService.deletePipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] });
    }
  });

  // Reorder stages mutation
  const reorderStagesMutation = useMutation({
    mutationFn: PipelineStageService.reorderPipelineStages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update stage orders
    const stageOrders = items.map((stage, index) => ({
      id: stage.id,
      stage_order: index + 1
    }));

    reorderStagesMutation.mutate(stageOrders);
  };

  const getStageMetrics = (stageId: string): PipelineMetrics | undefined => {
    return metrics.find(m => m.stage_id === stageId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDays = (days: number) => {
    if (days < 1) return '< 1 day';
    if (days === 1) return '1 day';
    return `${Math.round(days)} days`;
  };

  const isLoading = isLoadingStages || isLoadingMetrics || isLoadingSummary;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline Stage Management</h2>
          <p className="text-muted-foreground">
            Configure and optimize your sales pipeline stages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Stage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Pipeline Stage</DialogTitle>
              <DialogDescription>
                Add a new stage to your sales pipeline
              </DialogDescription>
            </DialogHeader>
            <StageForm
              onSubmit={(data) => createStageMutation.mutate(data)}
              isLoading={createStageMutation.isPending}
              nextOrder={stages.length + 1}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Summary Cards */}
      {!isLoading && performanceSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceSummary.total_opportunities}</div>
              <p className="text-xs text-muted-foreground">
                Across all pipeline stages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(performanceSummary.total_pipeline_value)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total value in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(performanceSummary.average_deal_size)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average opportunity value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceSummary.overall_conversion_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall pipeline conversion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Pipeline Stages</TabsTrigger>
          <TabsTrigger value="metrics">Stage Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="pipeline-stages">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {stages.map((stage, index) => {
                      const stageMetrics = getStageMetrics(stage.id);
                      return (
                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                              }`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: stage.stage_color || '#94a3b8' }}
                                      />
                                      <div>
                                        <CardTitle className="text-lg">{stage.stage_name}</CardTitle>
                                        <CardDescription>{stage.stage_description}</CardDescription>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={stage.is_active ? "default" : "secondary"}>
                                      {stage.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {stage.probability_percentage}% probability
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {stageMetrics && (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Opportunities</p>
                                      <p className="font-medium">{stageMetrics.opportunity_count}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Total Value</p>
                                      <p className="font-medium">{formatCurrency(stageMetrics.total_value)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Avg Time</p>
                                      <p className="font-medium">{formatDays(stageMetrics.average_time_in_stage)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Win Rate</p>
                                      <p className="font-medium">{stageMetrics.win_rate.toFixed(1)}%</p>
                                    </div>
                                  </div>
                                )}

                                {stage.required_fields && stage.required_fields.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Required Fields:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {stage.required_fields.map((field, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {field}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <Separator />

                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">
                                    Order: {stage.stage_order}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedStage(stage);
                                        setIsEditDialogOpen(true);
                                      }}
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
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {stages.length === 0 && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pipeline stages configured</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Set up your sales pipeline stages to start tracking opportunities
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Stage
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => {
              const stage = stages.find(s => s.id === metric.stage_id);
              return (
                <Card key={metric.stage_id}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage?.stage_color || '#94a3b8' }}
                      />
                      <CardTitle className="text-lg">{metric.stage_name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Opportunities</p>
                        <p className="text-2xl font-bold">{metric.opportunity_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(metric.total_value)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Conversion Rate</span>
                        <span>{metric.conversion_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metric.conversion_rate} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Win Rate</span>
                        <span>{metric.win_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metric.win_rate} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg Time in Stage</span>
                      <span className="font-medium">{formatDays(metric.average_time_in_stage)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg Deal Size</span>
                      <span className="font-medium">{formatCurrency(metric.average_value)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {performanceSummary && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceSummary.fastest_stage && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Fastest Stage</p>
                        <p className="text-sm text-muted-foreground">
                          {performanceSummary.fastest_stage.stage_name} - {formatDays(performanceSummary.fastest_stage.avg_time)}
                        </p>
                      </div>
                    </div>
                  )}

                  {performanceSummary.slowest_stage && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Slowest Stage</p>
                        <p className="text-sm text-muted-foreground">
                          {performanceSummary.slowest_stage.stage_name} - {formatDays(performanceSummary.slowest_stage.avg_time)}
                        </p>
                      </div>
                    </div>
                  )}

                  {performanceSummary.highest_value_stage && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Highest Value Stage</p>
                        <p className="text-sm text-muted-foreground">
                          {performanceSummary.highest_value_stage.stage_name} - {formatCurrency(performanceSummary.highest_value_stage.total_value)}
                        </p>
                      </div>
                    </div>
                  )}

                  {performanceSummary.bottleneck_stage && (
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Potential Bottleneck</p>
                        <p className="text-sm text-muted-foreground">
                          {performanceSummary.bottleneck_stage.stage_name} - {performanceSummary.bottleneck_stage.opportunity_count} opportunities
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">Optimize Stage Flow</p>
                      <p className="text-sm text-blue-700">
                        Review stages with low conversion rates and consider splitting or merging them.
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-900">Automate Transitions</p>
                      <p className="text-sm text-green-700">
                        Set up automation rules for stages with consistent patterns.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium text-orange-900">Address Bottlenecks</p>
                      <p className="text-sm text-orange-700">
                        Focus on stages with high opportunity counts but low progression rates.
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-900">Track Time Metrics</p>
                      <p className="text-sm text-purple-700">
                        Monitor average time in each stage to identify delays.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pipeline Stage</DialogTitle>
            <DialogDescription>
              Update your pipeline stage configuration
            </DialogDescription>
          </DialogHeader>
          {selectedStage && (
            <StageForm
              stage={selectedStage}
              onSubmit={(data) => updateStageMutation.mutate({
                id: selectedStage.id,
                updates: data
              })}
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
  stage?: PipelineStage;
  onSubmit: (data: Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>) => void;
  isLoading: boolean;
  nextOrder?: number;
}

const StageForm: React.FC<StageFormProps> = ({ stage, onSubmit, isLoading, nextOrder }) => {
  const [formData, setFormData] = useState({
    stage_name: stage?.stage_name || '',
    stage_order: stage?.stage_order || nextOrder || 1,
    probability_percentage: stage?.probability_percentage || 50,
    is_active: stage?.is_active ?? true,
    stage_color: stage?.stage_color || '#3b82f6',
    stage_description: stage?.stage_description || '',
    required_fields: stage?.required_fields || [],
    automation_rules: stage?.automation_rules || {}
  });

  const [newRequiredField, setNewRequiredField] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addRequiredField = () => {
    if (newRequiredField.trim() && !formData.required_fields.includes(newRequiredField.trim())) {
      setFormData({
        ...formData,
        required_fields: [...formData.required_fields, newRequiredField.trim()]
      });
      setNewRequiredField('');
    }
  };

  const removeRequiredField = (field: string) => {
    setFormData({
      ...formData,
      required_fields: formData.required_fields.filter(f => f !== field)
    });
  };

  const stageColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="stage_order">Stage Order</Label>
          <Input
            id="stage_order"
            type="number"
            min="1"
            value={formData.stage_order}
            onChange={(e) => setFormData({ ...formData, stage_order: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="probability_percentage">Probability Percentage</Label>
          <Input
            id="probability_percentage"
            type="number"
            min="0"
            max="100"
            value={formData.probability_percentage}
            onChange={(e) => setFormData({ ...formData, probability_percentage: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Stage Color</Label>
          <div className="flex space-x-2">
            {stageColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.stage_color === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, stage_color: color })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage_description">Description</Label>
        <Textarea
          id="stage_description"
          value={formData.stage_description}
          onChange={(e) => setFormData({ ...formData, stage_description: e.target.value })}
          placeholder="Describe this stage..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Required Fields</Label>
        <div className="flex space-x-2">
          <Input
            value={newRequiredField}
            onChange={(e) => setNewRequiredField(e.target.value)}
            placeholder="Add required field"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredField())}
          />
          <Button type="button" onClick={addRequiredField}>Add</Button>
        </div>
        {formData.required_fields.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.required_fields.map((field) => (
              <Badge key={field} variant="secondary" className="cursor-pointer" onClick={() => removeRequiredField(field)}>
                {field} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active Stage</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : stage ? 'Update Stage' : 'Create Stage'}
        </Button>
      </div>
    </form>
  );
};