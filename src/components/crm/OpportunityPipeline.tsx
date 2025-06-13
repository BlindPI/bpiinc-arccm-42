
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, Calendar, MoreHorizontal, User, Edit, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { CRMService } from '@/services/crm/crmService';
import type { Opportunity } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { OpportunityForm } from './OpportunityForm';
import { useAuth } from '@/contexts/AuthContext';

const stageColors = {
  prospect: 'bg-gray-100 border-gray-300',
  proposal: 'bg-blue-100 border-blue-300',
  negotiation: 'bg-yellow-100 border-yellow-300',
  closed_won: 'bg-green-100 border-green-300',
  closed_lost: 'bg-red-100 border-red-300'
};

const stageNames = {
  prospect: 'Prospect',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost'
};

export const OpportunityPipeline: React.FC = () => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: opportunities, isLoading, error } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => CRMService.getOpportunities(),
    refetchOnWindowFocus: false,
    retry: 2
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => CRMService.createOpportunity({
      ...data,
      opportunity_status: 'open',
      created_by: user?.id || 'unknown'
    }),
    onSuccess: () => {
      toast.success('Opportunity created successfully');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsFormOpen(false);
      setSelectedOpportunity(null);
    },
    onError: (error: any) => {
      console.error('Create opportunity error:', error);
      toast.error('Failed to create opportunity');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Opportunity> }) =>
      CRMService.updateOpportunity(id, data),
    onSuccess: () => {
      toast.success('Opportunity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsFormOpen(false);
      setSelectedOpportunity(null);
      setIsUpdating(null);
    },
    onError: (error: any) => {
      console.error('Update opportunity error:', error);
      toast.error('Failed to update opportunity');
      setIsUpdating(null);
    }
  });

  const groupedOpportunities = opportunities?.reduce((acc, opp) => {
    if (!acc[opp.stage]) acc[opp.stage] = [];
    acc[opp.stage].push(opp);
    return acc;
  }, {} as Record<string, Opportunity[]>) || {};

  const stages = ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const handleStageChange = async (opportunity: Opportunity, newStage: string) => {
    setIsUpdating(opportunity.id);
    try {
      await updateMutation.mutateAsync({
        id: opportunity.id,
        data: { stage: newStage as Opportunity['stage'] }
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleOpportunitySaved = (data: any) => {
    if (selectedOpportunity) {
      updateMutation.mutate({
        id: selectedOpportunity.id,
        data
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const calculateStageValue = (stage: string) => {
    return groupedOpportunities[stage]?.reduce((sum, opp) => sum + opp.estimated_value, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-destructive">Failed to load opportunities</p>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['opportunities'] })}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sales Pipeline</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedOpportunity(null)}>
              <Plus className="mr-2 h-4 w-4" />
              New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedOpportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
              </DialogTitle>
            </DialogHeader>
            <OpportunityForm 
              opportunity={selectedOpportunity}
              onSave={handleOpportunitySaved}
              onCancel={() => setIsFormOpen(false)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage} className="space-y-3">
            <Card className={`${stageColors[stage as keyof typeof stageColors]}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {stageNames[stage as keyof typeof stageNames]}
                </CardTitle>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{groupedOpportunities[stage]?.length || 0} opportunities</span>
                  <span className="font-medium">
                    {formatCurrency(calculateStageValue(stage))}
                  </span>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3 min-h-[400px]">
              {groupedOpportunities[stage]?.map((opportunity) => (
                <Card
                  key={opportunity.id}
                  className={`p-3 hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
                    isUpdating === opportunity.id ? 'opacity-50' : ''
                  }`}
                >
                  {isUpdating === opportunity.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      {/* Header with title and actions */}
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1 pr-2">
                          {opportunity.opportunity_name}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isUpdating === opportunity.id}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOpportunity(opportunity);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {stages.filter(s => s !== opportunity.stage).map((stageOption) => (
                              <DropdownMenuItem
                                key={stageOption}
                                onClick={() => handleStageChange(opportunity, stageOption)}
                                disabled={isUpdating === opportunity.id}
                              >
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Move to {stageNames[stageOption as keyof typeof stageNames]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Value and probability */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(opportunity.estimated_value)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.probability}% probability
                        </Badge>
                      </div>

                      {/* Contact and date info */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {opportunity.contact_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{opportunity.contact_name}</span>
                          </div>
                        )}
                        {opportunity.expected_close_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(opportunity.expected_close_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress indicator */}
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ width: `${opportunity.probability}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!groupedOpportunities[stage] || groupedOpportunities[stage].length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No opportunities</p>
                  <p className="text-xs">Opportunities will appear here when added to this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
