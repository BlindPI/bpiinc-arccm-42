
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CRMService } from '@/services/crm/crmService';
import { toast } from '@/hooks/use-toast';
import type { Lead, Opportunity } from '@/types/crm';

interface LeadConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadConversionModal({ lead, isOpen, onClose }: LeadConversionModalProps) {
  const [conversionOptions, setConversionOptions] = useState({
    createContact: true,
    createAccount: !!lead.company_name,
    createOpportunity: true,
  });

  const [opportunityData, setOpportunityData] = useState<{
    opportunity_name: string;
    estimated_value: number;
    stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability: number;
  }>({
    opportunity_name: `${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Individual'}`,
    estimated_value: 0,
    stage: 'prospect',
    probability: 25,
  });

  const queryClient = useQueryClient();

  const convertLeadMutation = useMutation({
    mutationFn: async () => {
      return await CRMService.convertLead(lead.id, {
        ...conversionOptions,
        opportunityData: conversionOptions.createOpportunity ? opportunityData : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Lead Converted',
        description: 'Lead has been successfully converted.',
      });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Conversion Failed',
        description: error.message || 'Failed to convert lead.',
        variant: 'destructive',
      });
    },
  });

  const handleConvert = () => {
    convertLeadMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead.first_name} {lead.last_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conversion Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What would you like to create?</h3>
            
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createAccount"
                checked={conversionOptions.createAccount}
                onCheckedChange={(checked) =>
                  setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                }
                disabled={!lead.company_name}
              />
              <Label htmlFor="createAccount">
                Create Account {!lead.company_name && '(No company name provided)'}
              </Label>
            </div>

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
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Opportunity Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="opportunityName">Opportunity Name</Label>
                <Input
                  id="opportunityName"
                  value={opportunityData.opportunity_name}
                  onChange={(e) =>
                    setOpportunityData(prev => ({ ...prev, opportunity_name: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={opportunityData.estimated_value}
                    onChange={(e) =>
                      setOpportunityData(prev => ({ ...prev, estimated_value: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={opportunityData.probability}
                    onChange={(e) =>
                      setOpportunityData(prev => ({ ...prev, probability: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
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
            </div>
          )}

          {/* Lead Summary */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-medium">Lead Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {lead.first_name} {lead.last_name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lead.email}
              </div>
              <div>
                <span className="font-medium">Company:</span> {lead.company_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Lead Score:</span> {lead.lead_score}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={convertLeadMutation.isPending}
          >
            {convertLeadMutation.isPending ? 'Converting...' : 'Convert Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
