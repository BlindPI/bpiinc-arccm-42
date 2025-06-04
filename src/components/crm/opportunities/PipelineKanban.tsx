import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Calendar, 
  User, 
  MoreHorizontal, 
  Plus, 
  Filter,
  TrendingUp,
  Clock,
  AlertTriangle,
  Target,
  Building,
  Users,
  MapPin
} from 'lucide-react';
import { crmOpportunityService } from '@/services/crm/crmOpportunityService';
import { CRMOpportunity, OpportunityFilters } from '@/types/crm';

interface PipelineStage {
  id: string;
  name: string;
  pipeline_type: 'individual' | 'corporate' | 'ap_partnership';
  stage_order: number;
  probability_default: number;
  is_closed_won: boolean;
  is_closed_lost: boolean;
  opportunities: CRMOpportunity[];
  total_value: number;
  count: number;
}

interface PipelineKanbanProps {
  pipelineType?: 'individual' | 'corporate' | 'ap_partnership' | 'all';
  onOpportunitySelect?: (opportunity: CRMOpportunity) => void;
  onCreateOpportunity?: () => void;
}

export function PipelineKanban({ 
  pipelineType = 'all', 
  onOpportunitySelect, 
  onCreateOpportunity 
}: PipelineKanbanProps) {
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<CRMOpportunity | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Mock pipeline stages (in real implementation, this would come from the database)
  const pipelineStages: Record<string, PipelineStage[]> = {
    individual: [
      { id: 'ind-1', name: 'Initial Contact', pipeline_type: 'individual', stage_order: 1, probability_default: 10, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ind-2', name: 'Needs Assessment', pipeline_type: 'individual', stage_order: 2, probability_default: 25, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ind-3', name: 'Proposal Sent', pipeline_type: 'individual', stage_order: 3, probability_default: 50, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ind-4', name: 'Negotiation', pipeline_type: 'individual', stage_order: 4, probability_default: 75, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ind-5', name: 'Closed Won', pipeline_type: 'individual', stage_order: 5, probability_default: 100, is_closed_won: true, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ind-6', name: 'Closed Lost', pipeline_type: 'individual', stage_order: 6, probability_default: 0, is_closed_won: false, is_closed_lost: true, opportunities: [], total_value: 0, count: 0 }
    ],
    corporate: [
      { id: 'corp-1', name: 'Lead Qualification', pipeline_type: 'corporate', stage_order: 1, probability_default: 15, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'corp-2', name: 'Discovery Call', pipeline_type: 'corporate', stage_order: 2, probability_default: 30, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'corp-3', name: 'Proposal Development', pipeline_type: 'corporate', stage_order: 3, probability_default: 45, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'corp-4', name: 'Contract Review', pipeline_type: 'corporate', stage_order: 4, probability_default: 70, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'corp-5', name: 'Closed Won', pipeline_type: 'corporate', stage_order: 5, probability_default: 100, is_closed_won: true, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'corp-6', name: 'Closed Lost', pipeline_type: 'corporate', stage_order: 6, probability_default: 0, is_closed_won: false, is_closed_lost: true, opportunities: [], total_value: 0, count: 0 }
    ],
    ap_partnership: [
      { id: 'ap-1', name: 'Initial Interest', pipeline_type: 'ap_partnership', stage_order: 1, probability_default: 20, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ap-2', name: 'Application Review', pipeline_type: 'ap_partnership', stage_order: 2, probability_default: 40, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ap-3', name: 'Site Visit', pipeline_type: 'ap_partnership', stage_order: 3, probability_default: 60, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ap-4', name: 'Agreement Negotiation', pipeline_type: 'ap_partnership', stage_order: 4, probability_default: 80, is_closed_won: false, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ap-5', name: 'Partnership Active', pipeline_type: 'ap_partnership', stage_order: 5, probability_default: 100, is_closed_won: true, is_closed_lost: false, opportunities: [], total_value: 0, count: 0 },
      { id: 'ap-6', name: 'Application Rejected', pipeline_type: 'ap_partnership', stage_order: 6, probability_default: 0, is_closed_won: false, is_closed_lost: true, opportunities: [], total_value: 0, count: 0 }
    ]
  };

  // Fetch opportunities with real data integration
  const { data: opportunitiesResponse, isLoading, error } = useQuery({
    queryKey: ['crm', 'opportunities', pipelineType, filters, searchTerm],
    queryFn: async () => {
      const searchFilters = { ...filters };
      
      if (pipelineType !== 'all') {
        searchFilters.opportunity_type = pipelineType;
      }
      
      const result = await crmOpportunityService.getOpportunities(searchFilters, 1, 200);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30000,
  });

  // Real drag-and-drop stage updates
  const updateStageMutation = useMutation({
    mutationFn: async ({ opportunityId, newStage }: { opportunityId: string, newStage: string }) => {
      const result = await crmOpportunityService.updateStage(opportunityId, newStage);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunities'] });
    },
  });

  const opportunities = opportunitiesResponse?.data || [];

  // Filter opportunities by search term
  const filteredOpportunities = opportunities.filter(opp => 
    !searchTerm || 
    opp.opportunity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.stage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stages for current pipeline type
  const getCurrentStages = (): PipelineStage[] => {
    if (pipelineType === 'all') {
      // Combine all pipeline types
      return [
        ...pipelineStages.individual,
        ...pipelineStages.corporate,
        ...pipelineStages.ap_partnership
      ];
    }
    return pipelineStages[pipelineType] || [];
  };

  // Organize opportunities by stage
  const organizeOpportunitiesByStage = (): PipelineStage[] => {
    const stages = getCurrentStages();
    
    return stages.map(stage => {
      const stageOpportunities = filteredOpportunities.filter(opp => 
        opp.stage === stage.name && 
        (pipelineType === 'all' || opp.opportunity_type === stage.pipeline_type)
      );
      
      const total_value = stageOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
      
      return {
        ...stage,
        opportunities: stageOpportunities,
        total_value,
        count: stageOpportunities.length
      };
    });
  };

  const stagesWithOpportunities = organizeOpportunitiesByStage();

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const opportunityId = draggableId;
    const newStage = destination.droppableId;

    updateStageMutation.mutate({ opportunityId, newStage });
  }, [updateStageMutation]);

  // Get opportunity type badge color
  const getOpportunityTypeBadge = (type: string) => {
    const styles = {
      individual_training: 'bg-blue-100 text-blue-800',
      corporate_contract: 'bg-purple-100 text-purple-800',
      ap_partnership: 'bg-green-100 text-green-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Get stage color based on type
  const getStageColor = (stage: PipelineStage) => {
    if (stage.is_closed_won) return 'border-green-500 bg-green-50';
    if (stage.is_closed_lost) return 'border-red-500 bg-red-50';
    
    const colors = {
      individual: 'border-blue-500 bg-blue-50',
      corporate: 'border-purple-500 bg-purple-50',
      ap_partnership: 'border-green-500 bg-green-50'
    };
    return colors[stage.pipeline_type] || 'border-gray-300 bg-gray-50';
  };

  // Check if opportunity is stalled (14+ days without activity)
  const isStalled = (opportunity: CRMOpportunity): boolean => {
    const lastUpdate = new Date(opportunity.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate >= 14;
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading pipeline: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
          <p className="text-gray-600">
            {pipelineType === 'all' ? 'All Pipelines' : `${pipelineType.replace('_', ' ')} Pipeline`} • 
            {filteredOpportunities.length} opportunities • 
            {formatCurrency(filteredOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0))} total value
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={onCreateOpportunity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={filters.assigned_to || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Assignees</SelectItem>
                  <SelectItem value="user-1">Sarah Johnson</SelectItem>
                  <SelectItem value="user-2">Mike Chen</SelectItem>
                  <SelectItem value="user-3">Emily Rodriguez</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Kanban Board */}
      <div className="overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 min-w-max pb-4">
            {stagesWithOpportunities.map((stage) => (
              <div key={stage.id} className="w-80 flex-shrink-0">
                <Card className={`h-full ${getStageColor(stage)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stage.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white border">
                          {stage.count}
                        </div>
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white border">
                          {stage.probability_default}%
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {formatCurrency(stage.total_value)} total value
                    </CardDescription>
                  </CardHeader>
                  
                  <Droppable droppableId={stage.name}>
                    {(provided, snapshot) => (
                      <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {stage.opportunities.map((opportunity, index) => (
                          <Draggable
                            key={opportunity.id}
                            draggableId={opportunity.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-pointer transition-shadow hover:shadow-md ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                } ${isStalled(opportunity) ? 'border-orange-300 bg-orange-50' : ''}`}
                                onClick={() => onOpportunitySelect?.(opportunity)}
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">
                                          {opportunity.opportunity_name}
                                        </h4>
                                        <div className="flex items-center gap-1 mt-1">
                                          <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getOpportunityTypeBadge(opportunity.opportunity_type)}`}>
                                            {opportunity.opportunity_type.replace('_', ' ')}
                                          </div>
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => onOpportunitySelect?.(opportunity)}>
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            Edit Opportunity
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            Add Activity
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            Close as Won
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            Close as Lost
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Value and Probability */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 text-sm font-medium">
                                        <DollarSign className="h-3 w-3 text-green-600" />
                                        {formatCurrency(opportunity.estimated_value || 0)}
                                      </div>
                                      <div className="flex items-center gap-1 text-sm">
                                        <TrendingUp className="h-3 w-3 text-blue-600" />
                                        {opportunity.probability}%
                                      </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-1 text-xs text-gray-600">
                                      {opportunity.participant_count && (
                                        <div className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {opportunity.participant_count} participants
                                        </div>
                                      )}
                                      {opportunity.training_location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {opportunity.training_location}
                                        </div>
                                      )}
                                      {opportunity.expected_close_date && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Close: {new Date(opportunity.expected_close_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        {opportunity.assigned_to && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <User className="h-3 w-3" />
                                            Assigned
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {isStalled(opportunity) && (
                                          <div className="flex items-center gap-1 text-xs text-orange-600">
                                            <Clock className="h-3 w-3" />
                                            Stalled
                                          </div>
                                        )}
                                        {opportunity.probability >= 75 && (
                                          <div className="flex items-center gap-1 text-xs text-green-600">
                                            <Target className="h-3 w-3" />
                                            Hot
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Add Opportunity Button */}
                        <Button
                          variant="ghost"
                          className="w-full border-2 border-dashed border-gray-300 h-12"
                          onClick={onCreateOpportunity}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Opportunity
                        </Button>
                      </CardContent>
                    )}
                  </Droppable>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first opportunity'
              }
            </p>
            <Button onClick={onCreateOpportunity}>
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}