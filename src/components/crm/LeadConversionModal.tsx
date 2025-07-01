
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CRMService } from '@/services/crm/crmService';
import type { Lead, Contact, Account, Opportunity } from '@/types/crm';
import { toast } from 'sonner';

const conversionSchema = z.object({
  createContact: z.boolean(),
  createAccount: z.boolean(),
  createOpportunity: z.boolean(),
  
  // Contact fields
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
  
  // Account fields
  accountName: z.string().optional(),
  accountType: z.enum(['prospect', 'customer', 'partner', 'competitor']).optional(),
  industry: z.string().optional(),
  
  // Opportunity fields
  opportunityName: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  stage: z.enum(['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  
  notes: z.string().optional(),
});

type ConversionFormData = z.infer<typeof conversionSchema>;

interface LeadConversionModalProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  open,
  onClose,
  onSuccess
}) => {
  const [warnings, setWarnings] = useState<string[]>([]);

  const form = useForm<ConversionFormData>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      createContact: true,
      createAccount: !!lead.company_name,
      createOpportunity: true,
      contactEmail: lead.email,
      contactPhone: lead.phone,
      contactTitle: lead.job_title,
      accountName: lead.company_name,
      accountType: 'prospect',
      opportunityName: `${lead.first_name} ${lead.last_name} - Training Opportunity`,
      estimatedValue: 5000,
      stage: 'prospect',
    },
  });

  const conversionMutation = useMutation({
    mutationFn: async (data: ConversionFormData) => {
      const results: any = {};
      
      // Create contact
      if (data.createContact) {
        const contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'> = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: data.contactEmail || lead.email,
          phone: data.contactPhone,
          title: data.contactTitle,
          contact_status: 'active',
          converted_from_lead_id: lead.id,
          lead_source: lead.lead_source,
        };
        results.contact = await CRMService.createContact(contactData);
      }
      
      // Create account
      if (data.createAccount && data.accountName) {
        const accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
          account_name: data.accountName,
          account_type: data.accountType || 'prospect',
          industry: data.industry,
          account_status: 'active',
          converted_from_lead_id: lead.id,
        };
        results.account = await CRMService.createAccount(accountData);
      }
      
      // Create opportunity
      if (data.createOpportunity && data.opportunityName) {
        const opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'> = {
          opportunity_name: data.opportunityName,
          estimated_value: data.estimatedValue || 0,
          stage: data.stage || 'prospect',
          probability: 25,
          account_id: results.account?.id,
          lead_id: lead.id,
          opportunity_status: 'open',
        };
        results.opportunity = await CRMService.createOpportunity(opportunityData);
      }
      
      // Update lead status to converted
      await CRMService.updateLead(lead.id, { 
        lead_status: 'converted',
        notes: data.notes 
      });
      
      return results;
    },
    onSuccess: () => {
      toast.success('Lead converted successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Conversion error:', error);
      toast.error('Failed to convert lead');
    },
  });

  const handleSubmit = (data: ConversionFormData) => {
    const newWarnings: string[] = [];
    
    if (data.createAccount && !data.accountName) {
      newWarnings.push('Account name is required to create an account');
    }
    
    if (data.createOpportunity && !data.opportunityName) {
      newWarnings.push('Opportunity name is required to create an opportunity');
    }
    
    setWarnings(newWarnings);
    
    if (newWarnings.length === 0) {
      conversionMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead.first_name} {lead.last_name}</DialogTitle>
        </DialogHeader>

        {warnings.length > 0 && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Conversion Options */}
            <div className="space-y-4">
              <h3 className="font-medium">What would you like to create?</h3>
              
              <FormField
                control={form.control}
                name="createContact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Create Contact</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="createAccount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Create Account</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="createOpportunity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Create Opportunity</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Details */}
            {form.watch('createContact') && (
              <div className="space-y-4">
                <h3 className="font-medium">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Account Details */}
            {form.watch('createAccount') && (
              <div className="space-y-4">
                <h3 className="font-medium">Account Details</h3>
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="competitor">Competitor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Opportunity Details */}
            {form.watch('createOpportunity') && (
              <div className="space-y-4">
                <h3 className="font-medium">Opportunity Details</h3>
                <FormField
                  control={form.control}
                  name="opportunityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value ($)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed_won">Closed Won</SelectItem>
                            <SelectItem value="closed_lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={conversionMutation.isPending}
              >
                {conversionMutation.isPending ? 'Converting...' : 'Convert Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
