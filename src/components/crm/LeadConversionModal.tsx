
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadConversionService } from '@/services/crm/leadConversionService';
import { CRMService } from '@/services/crm/crmService';
import type { Lead } from '@/types/crm';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface LeadConversionModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  isOpen,
  onClose
}) => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  const [conversionOptions, setConversionOptions] = useState({
    createContact: true,
    createAccount: false,
    createOpportunity: false
  });

  const [opportunityData, setOpportunityData] = useState({
    opportunity_name: '',
    estimated_value: 0,
    stage: 'prospect' as const,
    probability: 50
  });

  const convertLeadMutation = useMutation({
    mutationFn: ({ leadId, options, convertedBy }: { 
      leadId: string; 
      options: any;
      convertedBy: string;
    }) => LeadConversionService.convertLead(leadId, options, convertedBy),
    onSuccess: () => {
      toast.success('Lead converted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to convert lead');
    }
  });

  const createOpportunityMutation = useMutation({
    mutationFn: CRMService.createOpportunity,
    onSuccess: () => {
      toast.success('Opportunity created successfully!');
    }
  });

  const handleConvert = async () => {
    if (!lead || !profile?.id) return;

    try {
      // Convert the lead first
      const result = await LeadConversionService.convertLead(
        lead.id,
        {
          createContact: conversionOptions.createContact,
          createAccount: conversionOptions.createAccount,
          createOpportunity: false // We'll handle opportunity separately
        },
        profile.id
      );

      // Create opportunity if requested
      if (conversionOptions.createOpportunity && opportunityData.opportunity_name) {
        await CRMService.createOpportunity({
          opportunity_name: opportunityData.opportunity_name,
          estimated_value: opportunityData.estimated_value,
          stage: opportunityData.stage,
          probability: opportunityData.probability,
          account_id: result.account?.id,
          lead_id: lead.id,
          opportunity_status: 'open',
          created_by: profile.id
        });
      }

      // Update lead status
      await CRMService.updateLead(lead.id, { lead_status: 'converted' });

      toast.success('Lead converted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onClose();
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert lead');
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert Lead</DialogTitle>
          <DialogDescription>
            Convert {lead.first_name} {lead.last_name} to contacts, accounts, and opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conversion Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Create Records</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createContact"
                checked={conversionOptions.createContact}
                onCheckedChange={(checked) =>
                  setConversionOptions(prev => ({ ...prev, createContact: !!checked }))
                }
              />
              <Label htmlFor="createContact">Create Contact</Label>
            </div>

            {lead.company_name && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createAccount"
                  checked={conversionOptions.createAccount}
                  onCheckedChange={(checked) =>
                    setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                  }
                />
                <Label htmlFor="createAccount">
                  Create Account for {lead.company_name}
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createOpportunity"
                checked={conversionOptions.createOpportunity}
                onCheckedChange={(checked) =>
                  setConversionOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                }
              />
              <Label htmlFor="createOpportunity">Create Opportunity</Label>
            </div>
          </div>

          {/* Opportunity Details */}
          {conversionOptions.createOpportunity && (
            <div className="space-y-4">
              <h4 className="font-medium">Opportunity Details</h4>
              
              <div>
                <Label htmlFor="opportunity_name">Opportunity Name</Label>
                <Input
                  id="opportunity_name"
                  value={opportunityData.opportunity_name}
                  onChange={(e) => setOpportunityData(prev => ({ 
                    ...prev, 
                    opportunity_name: e.target.value 
                  }))}
                  placeholder="Enter opportunity name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_value">Value</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    value={opportunityData.estimated_value}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      estimated_value: Number(e.target.value) 
                    }))}
                  />
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
                      probability: Number(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={opportunityData.stage}
                  onValueChange={(value) => setOpportunityData(prev => ({ 
                    ...prev, 
                    stage: value as any 
                  }))}
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertLeadMutation.isPending}
            >
              {convertLeadMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
