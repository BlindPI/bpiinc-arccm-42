
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';

const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  lead_status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  lead_source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other']),
  lead_score: z.number().min(0).max(100),
  notes: z.string().optional(),
  training_urgency: z.enum(['immediate', 'within_month', 'within_quarter', 'planning']).optional(),
  estimated_participant_count: z.number().optional(),
  budget_range: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  onSuccess: () => void;
}

export function CreateLeadModal({ open, onOpenChange, lead, onSuccess }: CreateLeadModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: lead?.first_name || '',
      last_name: lead?.last_name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      company_name: lead?.company_name || '',
      job_title: lead?.job_title || '',
      lead_status: lead?.lead_status || 'new',
      lead_source: lead?.lead_source || 'website',
      lead_score: lead?.lead_score || 25,
      notes: lead?.notes || '',
      training_urgency: lead?.training_urgency || 'planning',
      estimated_participant_count: lead?.estimated_participant_count || undefined,
      budget_range: lead?.budget_range || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) => CRMService.createLead(data),
    onSuccess: () => {
      toast.success('Lead created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to create lead: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: LeadFormData) => CRMService.updateLead(lead.id, data),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + error.message);
    }
  });

  const handleSubmit = (data: LeadFormData) => {
    if (lead) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Safety Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lead Classification */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="trade_show">Trade Show</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="25"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Training Details */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="training_urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Urgency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="within_month">Within Month</SelectItem>
                        <SelectItem value="within_quarter">Within Quarter</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_participant_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Participants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="25"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <FormControl>
                      <Input placeholder="$5,000 - $10,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this lead..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Saving...' 
                  : lead ? 'Update Lead' : 'Create Lead'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
