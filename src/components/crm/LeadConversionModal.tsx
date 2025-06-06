
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, User, Target } from 'lucide-react';
import { Lead } from '@/services/crm/crmService';
import { LeadConversionService, ConversionResult, ConversionOptions } from '@/services/crm/leadConversionService';
import { toast } from 'sonner';

interface LeadConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ConversionResult) => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    createContact: true,
    createAccount: true,
    createOpportunity: true,
    contactData: {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email,
      phone: lead.phone || '',
      title: lead.job_title || ''
    },
    accountData: {
      account_name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
      account_type: 'prospect' as const
    },
    opportunityData: {
      opportunity_name: `${lead.company_name || lead.first_name} - Training Opportunity`,
      estimated_value: 5000,
      probability: 25,
      stage: 'prospect' as const
    }
  });

  const queryClient = useQueryClient();

  const conversionMutation = useMutation({
    mutationFn: (options: ConversionOptions) => 
      LeadConversionService.convertLead(lead, options),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Lead converted successfully!');
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        onSuccess(result);
        onClose();
      } else {
        toast.error(result.error || 'Failed to convert lead');
      }
    },
    onError: () => {
      toast.error('Failed to convert lead');
    }
  });

  const handleConvert = () => {
    conversionMutation.mutate(conversionOptions);
  };

  const updateContactData = (field: string, value: string) => {
    setConversionOptions(prev => ({
      ...prev,
      contactData: {
        ...prev.contactData,
        [field]: value
      }
    }));
  };

  const updateAccountData = (field: string, value: string) => {
    setConversionOptions(prev => ({
      ...prev,
      accountData: {
        ...prev.accountData,
        [field]: value
      }
    }));
  };

  const updateOpportunityData = (field: string, value: string | number) => {
    setConversionOptions(prev => ({
      ...prev,
      opportunityData: {
        ...prev.opportunityData,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead.first_name} {lead.last_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {lead.first_name} {lead.last_name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {lead.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {lead.phone || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Company:</span> {lead.company_name || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Title:</span> {lead.job_title || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Source:</span> {lead.lead_source}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <Checkbox 
                    checked={conversionOptions.createContact}
                    onCheckedChange={(checked) => 
                      setConversionOptions(prev => ({ ...prev, createContact: !!checked }))
                    }
                  />
                  Create Contact
                </CardTitle>
              </CardHeader>
              {conversionOptions.createContact && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contact-first-name">First Name</Label>
                    <Input
                      id="contact-first-name"
                      value={conversionOptions.contactData?.first_name || ''}
                      onChange={(e) => updateContactData('first_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-last-name">Last Name</Label>
                    <Input
                      id="contact-last-name"
                      value={conversionOptions.contactData?.last_name || ''}
                      onChange={(e) => updateContactData('last_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={conversionOptions.contactData?.email || ''}
                      onChange={(e) => updateContactData('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      value={conversionOptions.contactData?.phone || ''}
                      onChange={(e) => updateContactData('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-title">Title</Label>
                    <Input
                      id="contact-title"
                      value={conversionOptions.contactData?.title || ''}
                      onChange={(e) => updateContactData('title', e.target.value)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Account Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  <Checkbox 
                    checked={conversionOptions.createAccount}
                    onCheckedChange={(checked) => 
                      setConversionOptions(prev => ({ ...prev, createAccount: !!checked }))
                    }
                  />
                  Create Account
                </CardTitle>
              </CardHeader>
              {conversionOptions.createAccount && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      value={conversionOptions.accountData?.account_name || ''}
                      onChange={(e) => updateAccountData('account_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-website">Website</Label>
                    <Input
                      id="account-website"
                      value={conversionOptions.accountData?.website || ''}
                      onChange={(e) => updateAccountData('website', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-industry">Industry</Label>
                    <Input
                      id="account-industry"
                      value={conversionOptions.accountData?.industry || ''}
                      onChange={(e) => updateAccountData('industry', e.target.value)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Opportunity Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <Checkbox 
                    checked={conversionOptions.createOpportunity}
                    onCheckedChange={(checked) => 
                      setConversionOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                    }
                  />
                  Create Opportunity
                </CardTitle>
              </CardHeader>
              {conversionOptions.createOpportunity && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="opp-name">Opportunity Name</Label>
                    <Input
                      id="opp-name"
                      value={conversionOptions.opportunityData?.opportunity_name || ''}
                      onChange={(e) => updateOpportunityData('opportunity_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opp-value">Estimated Value ($)</Label>
                    <Input
                      id="opp-value"
                      type="number"
                      value={conversionOptions.opportunityData?.estimated_value || 0}
                      onChange={(e) => updateOpportunityData('estimated_value', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opp-probability">Probability (%)</Label>
                    <Input
                      id="opp-probability"
                      type="number"
                      min="0"
                      max="100"
                      value={conversionOptions.opportunityData?.probability || 0}
                      onChange={(e) => updateOpportunityData('probability', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={conversionMutation.isPending}
            >
              {conversionMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
