
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import { Building2, User, Target } from 'lucide-react';
import type { Lead } from '@/types/crm';

interface LeadConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function LeadConversionModal({ open, onOpenChange, lead, onSuccess }: LeadConversionModalProps) {
  const queryClient = useQueryClient();
  
  const [conversionOptions, setConversionOptions] = useState({
    createContact: true,
    createAccount: !!lead.company_name,
    createOpportunity: true
  });

  const [opportunityData, setOpportunityData] = useState({
    opportunity_name: `${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Individual'}`,
    estimated_value: 0,
    stage: 'prospect' as const,
    probability: 25
  });

  const { mutate: convertLead, isPending } = useMutation({
    mutationFn: () => CRMService.convertLead(lead.id, {
      ...conversionOptions,
      opportunityData
    }),
    onSuccess: (result) => {
      toast.success('Lead converted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to convert lead');
      console.error('Conversion error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    convertLead();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead.first_name} {lead.last_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Conversion Options</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="createContact"
                  checked={conversionOptions.createContact}
                  onCheckedChange={(checked) => 
                    setConversionOptions(prev => ({ ...prev, createContact: !!checked }))
                  }
                />
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="createContact" className="text-base font-medium">
                    Create Contact
                  </Label>
                  <p className="text-sm text-gray-500">
                    Create a new contact record for {lead.first_name} {lead.last_name}
                  </p>
                </div>
              </div>

              {lead.company_name && (
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="createAccount"
                    checked={conversionOptions.createAccount}
                    onCheckedChange={(checked) => 
                      setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                    }
                  />
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label htmlFor="createAccount" className="text-base font-medium">
                      Create Account
                    </Label>
                    <p className="text-sm text-gray-500">
                      Create a new account for {lead.company_name}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="createOpportunity"
                  checked={conversionOptions.createOpportunity}
                  onCheckedChange={(checked) => 
                    setConversionOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                  }
                />
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="createOpportunity" className="text-base font-medium">
                    Create Opportunity
                  </Label>
                  <p className="text-sm text-gray-500">
                    Create a sales opportunity to track potential revenue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {conversionOptions.createOpportunity && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opportunity Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opportunity_name">Opportunity Name</Label>
                  <Input
                    id="opportunity_name"
                    value={opportunityData.opportunity_name}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      opportunity_name: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    min="0"
                    step="100"
                    value={opportunityData.estimated_value}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      estimated_value: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select 
                    value={opportunityData.stage} 
                    onValueChange={(value: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost') => 
                      setOpportunityData(prev => ({ ...prev, stage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={opportunityData.probability}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      probability: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
