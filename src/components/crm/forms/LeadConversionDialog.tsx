
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadConversionService, type LeadConversionOptions } from '@/services/crm/leadConversionService';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Lead, Opportunity } from '@/types/crm';
import { Users, Building, Target, CheckCircle } from 'lucide-react';

interface LeadConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess?: () => void;
}

export const LeadConversionDialog: React.FC<LeadConversionDialogProps> = ({
  open,
  onOpenChange,
  lead,
  onSuccess
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [conversionOptions, setConversionOptions] = useState<LeadConversionOptions>({
    createContact: true,
    createAccount: !!lead?.company_name,
    createOpportunity: true,
    contactData: {},
    accountData: {}
  });

  const [opportunityData, setOpportunityData] = useState({
    opportunity_name: lead?.company_name 
      ? `${lead.company_name} - Training Opportunity` 
      : `${lead?.first_name} ${lead?.last_name} - Training`,
    estimated_value: lead?.estimated_participant_count ? lead.estimated_participant_count * 500 : 5000,
    stage: 'prospect' as const,
    probability: 25,
    description: `Converted from lead: ${lead?.first_name} ${lead?.last_name}`,
    type: 'training_contract',
    expected_close_date: ''
  });

  const conversionMutation = useMutation({
    mutationFn: async () => {
      if (!lead || !user) throw new Error('Missing lead or user data');

      // Step 1: Convert lead to contact/account
      const conversionResult = await LeadConversionService.convertLead(
        lead.id,
        {
          ...conversionOptions,
          accountData: lead.company_name ? {
            account_name: lead.company_name,
            industry: lead.industry,
            company_size: lead.company_size,
            website: lead.website,
            phone: lead.phone,
            account_type: 'prospect' as const,
            account_status: 'active' as const
          } : undefined
        },
        user.id
      );

      if (!conversionResult.success) {
        throw new Error('Failed to convert lead');
      }

      // Step 2: Create opportunity if requested
      let opportunity = null;
      if (conversionOptions.createOpportunity) {
        // Ensure all required fields are provided
        const opportunityPayload = {
          opportunity_name: opportunityData.opportunity_name,
          estimated_value: opportunityData.estimated_value,
          stage: opportunityData.stage,
          probability: opportunityData.probability,
          description: opportunityData.description,
          type: opportunityData.type,
          expected_close_date: opportunityData.expected_close_date || undefined,
          lead_id: lead.id,
          account_id: conversionResult.account?.id,
          opportunity_status: 'open' as const,
          created_by: user.id
        } as Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>;

        opportunity = await CRMService.createOpportunity(opportunityPayload);
      }

      return {
        ...conversionResult,
        opportunity
      };
    },
    onSuccess: (result) => {
      toast.success('Lead converted successfully!');
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error converting lead:', error);
      toast.error('Failed to convert lead: ' + error.message);
    }
  });

  const handleConvert = () => {
    conversionMutation.mutate();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Convert Lead: {lead.first_name} {lead.last_name}
          </DialogTitle>
          <DialogDescription>
            Choose what to create when converting this lead to customer records
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conversion Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What to Create</h3>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createContact"
                    checked={conversionOptions.createContact}
                    onCheckedChange={(checked) =>
                      setConversionOptions(prev => ({ ...prev, createContact: !!checked }))
                    }
                  />
                  <Users className="h-4 w-4" />
                  <Label htmlFor="createContact" className="text-sm font-medium">Create Contact</Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Create a contact record for {lead.first_name} {lead.last_name}
                </p>
              </CardContent>
            </Card>

            {lead.company_name && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAccount"
                      checked={conversionOptions.createAccount}
                      onCheckedChange={(checked) =>
                        setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                      }
                    />
                    <Building className="h-4 w-4" />
                    <Label htmlFor="createAccount" className="text-sm font-medium">Create Account</Label>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Create an account record for {lead.company_name}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createOpportunity"
                    checked={conversionOptions.createOpportunity}
                    onCheckedChange={(checked) =>
                      setConversionOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                    }
                  />
                  <Target className="h-4 w-4" />
                  <Label htmlFor="createOpportunity" className="text-sm font-medium">Create Opportunity</Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Create a sales opportunity to track the potential deal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Details */}
          {conversionOptions.createOpportunity && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Opportunity Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="opportunity_name">Opportunity Name</Label>
                  <Input
                    id="opportunity_name"
                    value={opportunityData.opportunity_name}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, opportunity_name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      value={opportunityData.estimated_value}
                      onChange={(e) => setOpportunityData(prev => ({ ...prev, estimated_value: Number(e.target.value) }))}
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
                      onChange={(e) => setOpportunityData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select
                      value={opportunityData.stage}
                      onValueChange={(value) => setOpportunityData(prev => ({ ...prev, stage: value as any }))}
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
                    <Label htmlFor="expected_close_date">Expected Close Date</Label>
                    <Input
                      id="expected_close_date"
                      type="date"
                      value={opportunityData.expected_close_date}
                      onChange={(e) => setOpportunityData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={opportunityData.description}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={conversionMutation.isPending}
          >
            {conversionMutation.isPending ? 'Converting...' : 'Convert Lead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
