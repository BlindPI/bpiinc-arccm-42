
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
import { Target, User, Building, DollarSign } from 'lucide-react';

interface LeadConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onSuccess?: () => void;
}

export function LeadConversionModal({ open, onOpenChange, lead, onSuccess }: LeadConversionModalProps) {
  const queryClient = useQueryClient();
  
  const [conversionOptions, setConversionOptions] = useState({
    createContact: true,
    createAccount: !!lead?.company_name,
    createOpportunity: true
  });

  const [opportunityData, setOpportunityData] = useState({
    opportunity_name: lead ? `${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Individual'}` : '',
    estimated_value: 0,
    stage: 'prospect',
    probability: 25
  });

  const { mutate: convertLead, isPending } = useMutation({
    mutationFn: () => CRMService.convertLead(lead.id, {
      ...conversionOptions,
      opportunityData: conversionOptions.createOpportunity ? opportunityData : undefined
    }),
    onSuccess: (results) => {
      toast.success('Lead converted successfully!');
      
      // Show what was created
      const created = [];
      if (results.contact) created.push('Contact');
      if (results.account) created.push('Account');
      if (results.opportunity) created.push('Opportunity');
      
      if (created.length > 0) {
        toast.success(`Created: ${created.join(', ')}`);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to convert lead');
      console.error('Error converting lead:', error);
    }
  });

  const handleConvert = () => {
    if (!conversionOptions.createContact && !conversionOptions.createAccount && !conversionOptions.createOpportunity) {
      toast.error('Please select at least one conversion option');
      return;
    }
    
    convertLead();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Convert Lead: {lead.first_name} {lead.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Lead Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span> {lead.first_name} {lead.last_name}
              </div>
              <div>
                <span className="text-gray-600">Email:</span> {lead.email}
              </div>
              <div>
                <span className="text-gray-600">Company:</span> {lead.company_name || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Score:</span> {lead.lead_score}/100
              </div>
            </div>
          </div>

          {/* Conversion Options */}
          <div className="space-y-4">
            <h3 className="font-medium">What would you like to create?</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="create-contact"
                  checked={conversionOptions.createContact}
                  onCheckedChange={(checked) => 
                    setConversionOptions(prev => ({ ...prev, createContact: !!checked }))
                  }
                />
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="create-contact" className="font-medium">Create Contact</Label>
                  <p className="text-sm text-gray-600">
                    Convert this lead into a contact record
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="create-account"
                  checked={conversionOptions.createAccount}
                  onCheckedChange={(checked) => 
                    setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                  }
                  disabled={!lead.company_name}
                />
                <Building className="h-4 w-4 text-green-600" />
                <div>
                  <Label htmlFor="create-account" className="font-medium">Create Account</Label>
                  <p className="text-sm text-gray-600">
                    {lead.company_name ? 
                      `Create account for ${lead.company_name}` : 
                      'No company name available'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="create-opportunity"
                  checked={conversionOptions.createOpportunity}
                  onCheckedChange={(checked) => 
                    setConversionOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                  }
                />
                <DollarSign className="h-4 w-4 text-purple-600" />
                <div>
                  <Label htmlFor="create-opportunity" className="font-medium">Create Opportunity</Label>
                  <p className="text-sm text-gray-600">
                    Create a sales opportunity to track potential revenue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunity Details */}
          {conversionOptions.createOpportunity && (
            <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
              <h3 className="font-medium">Opportunity Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opp-name">Opportunity Name</Label>
                  <Input
                    id="opp-name"
                    value={opportunityData.opportunity_name}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      opportunity_name: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="opp-value">Estimated Value ($)</Label>
                  <Input
                    id="opp-value"
                    type="number"
                    value={opportunityData.estimated_value}
                    onChange={(e) => setOpportunityData(prev => ({ 
                      ...prev, 
                      estimated_value: Number(e.target.value) 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="opp-stage">Stage</Label>
                  <Select 
                    value={opportunityData.stage} 
                    onValueChange={(value) => setOpportunityData(prev => ({ 
                      ...prev, 
                      stage: value 
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

                <div>
                  <Label htmlFor="opp-probability">Probability (%)</Label>
                  <Input
                    id="opp-probability"
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
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={isPending}>
              {isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
