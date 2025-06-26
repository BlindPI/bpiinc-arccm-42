
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, DollarSign, Calendar, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService } from '@/services/crm/crmService';
import type { Opportunity } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { OpportunityForm } from './OpportunityForm';

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

  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => CRMService.getOpportunities()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => CRMService.createOpportunity({
      ...data,
      opportunity_status: 'open',
      created_by: 'current-user' // This should come from auth context
    }),
    onSuccess: () => {
      toast.success('Opportunity created successfully');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsFormOpen(false);
      setSelectedOpportunity(null);
    },
    onError: () => {
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
    },
    onError: () => {
      toast.error('Failed to update opportunity');
    }
  });

  const groupedOpportunities = opportunities?.reduce((acc, opp) => {
    if (!acc[opp.stage]) acc[opp.stage] = [];
    acc[opp.stage].push(opp);
    return acc;
  }, {} as Record<string, Opportunity[]>) || {};

  const stages = ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const handleStageChange = (opportunity: Opportunity, newStage: string) => {
    updateMutation.mutate({
      id: opportunity.id,
      data: { stage: newStage as Opportunity['stage'] }
    });
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
    return <div className="flex justify-center p-8">Loading pipeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sales Pipeline</h3>
        <Button onClick={() => {
          setSelectedOpportunity(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <div className="space-y-2 min-h-96">
              {groupedOpportunities[stage]?.map((opportunity) => (
                <Card key={opportunity.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {opportunity.opportunity_name}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOpportunity(opportunity);
                                setIsFormOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            {stages.map((stageOption) => 
                              stageOption !== opportunity.stage && (
                                <DropdownMenuItem
                                  key={stageOption}
                                  onClick={() => handleStageChange(opportunity, stageOption)}
                                >
                                  Move to {stageNames[stageOption as keyof typeof stageNames]}
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-green-600">
                          {formatCurrency(opportunity.estimated_value)}
                        </span>
                        <span className="text-muted-foreground">
                          {opportunity.probability}%
                        </span>
                      </div>

                      {opportunity.expected_close_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(opportunity.expected_close_date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!groupedOpportunities[stage] || groupedOpportunities[stage].length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No opportunities in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
