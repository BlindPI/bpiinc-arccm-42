
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

const leadFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  lead_source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other']),
  lead_status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  lead_score: z.number().min(0).max(100),
  lead_type: z.enum(['individual', 'corporate']).optional(),
  training_urgency: z.enum(['immediate', 'within_month', 'within_quarter', 'planning']).optional(),
  preferred_training_format: z.enum(['in_person', 'virtual', 'hybrid']).optional(),
  estimated_participant_count: z.number().optional(),
  budget_range: z.string().optional(),
  notes: z.string().optional()
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLead?: Lead;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
}

export function LeadFormDialog({ 
  open, 
  onOpenChange, 
  editingLead, 
  mode = 'create',
  onSuccess 
}: LeadFormDialogProps) {
  const queryClient = useQueryClient();
  const isReadOnly = mode === 'view';

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      first_name: editingLead?.first_name || '',
      last_name: editingLead?.last_name || '',
      email: editingLead?.email || '',
      phone: editingLead?.phone || '',
      company_name: editingLead?.company_name || '',
      job_title: editingLead?.job_title || '',
      lead_source: editingLead?.lead_source || 'website',
      lead_status: editingLead?.lead_status || 'new',
      lead_score: editingLead?.lead_score || 50,
      lead_type: editingLead?.lead_type || 'individual',
      training_urgency: editingLead?.training_urgency || 'planning',
      preferred_training_format: editingLead?.preferred_training_format || 'in_person',
      estimated_participant_count: editingLead?.estimated_participant_count || undefined,
      budget_range: editingLead?.budget_range || '',
      notes: editingLead?.notes || ''
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) => {
      // Ensure all required fields are present
      const leadData = {
        ...data,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        lead_source: data.lead_source,
        lead_status: data.lead_status,
        lead_score: data.lead_score
      } as Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
      
      return CRMService.createLead(leadData);
    },
    onSuccess: () => {
      toast.success('Lead created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to create lead: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: LeadFormData) => {
      if (!editingLead) throw new Error('No lead to update');
      return CRMService.updateLead(editingLead.id, data);
    },
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + error.message);
    }
  });

  const onSubmit = (data: LeadFormData) => {
    if (mode === 'edit' && editingLead) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Lead' : 
             mode === 'edit' ? 'Edit Lead' : 'View Lead'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isReadOnly} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isReadOnly} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isReadOnly} />
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
                      <Input {...field} disabled={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isReadOnly} />
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
                      <Input {...field} disabled={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="lead_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Score (0-100)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isReadOnly}
                      />
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
                    <Textarea {...field} rows={3} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isReadOnly && (
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
