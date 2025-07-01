
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';

interface AccountOpportunitiesTabProps {
  accountId: string;
}

export function AccountOpportunitiesTab({ accountId }: AccountOpportunitiesTabProps) {
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['account-opportunities', accountId],
    queryFn: () => CRMService.getOpportunities()
  });

  // Filter opportunities for this account
  const accountOpportunities = opportunities.filter(opp => opp.account_id === accountId);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading opportunities...</div>;
  }

  const totalValue = accountOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Opportunities ({accountOpportunities.length})</h3>
          <p className="text-sm text-gray-500">Total Value: ${totalValue.toLocaleString()}</p>
        </div>
        <Button onClick={() => setShowOpportunityForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Opportunity
        </Button>
      </div>

      <div className="space-y-3">
        {accountOpportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No opportunities yet</p>
            <p className="text-sm">Create opportunities to track potential revenue from this account</p>
          </div>
        ) : (
          accountOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{opportunity.opportunity_name}</h4>
                  <Badge className={getStageColor(opportunity.stage)}>
                    {opportunity.stage}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${opportunity.estimated_value?.toLocaleString() || '0'}
                  </div>
                  <span>Probability: {opportunity.probability}%</span>
                  <span>Status: {opportunity.opportunity_status}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
