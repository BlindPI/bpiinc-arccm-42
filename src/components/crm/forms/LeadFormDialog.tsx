
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { Lead, LeadStatus } from '@/types/supabase-schema';

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  lead_source: z.string(),
  lead_type: z.string().optional(),
  training_urgency: z.string().optional(),
  preferred_training_format: z.string().optional(),
  estimated_participant_count: z.string().optional(),
  budget_range: z.string().optional(),
  notes: z.string().optional()
});

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingLead?: Lead | null;
}

export function LeadFormDialog({ open, onOpenChange, onSuccess, editingLead }: LeadFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: editingLead?.first_name || '',
      last_name: editingLead?.last_name || '',
      email: editingLead?.email || '',
      phone: editingLead?.phone || '',
      company_name: editingLead?.company_name || '',
      job_title: editingLead?.job_title || '',
      lead_source: editingLead?.lead_source || 'website',
      lead_type: editingLead?.lead_type || undefined,
      training_urgency: editingLead?.training_urgency || undefined,
      preferred_training_format: editingLead?.preferred_training_format || undefined,
      estimated_participant_count: editingLead?.estimated_participant_count?.toString() || '',
      budget_range: editingLead?.budget_range || '',
      notes: editingLead?.notes || ''
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const leadData = {
        ...data,
        lead_score: 0,
        lead_status: editingLead?.lead_status || 'new' as LeadStatus,
        estimated_participant_count: data.estimated_participant_count ? parseInt(data.estimated_participant_count) : undefined,
      };

      if (editingLead) {
        await CRMService.updateLead(editingLead.id, leadData);
        toast.success('Lead updated successfully');
      } else {
        await CRMService.createLead(leadData);
        toast.success('Lead created successfully');
      }
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Failed to save lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingLead ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
          <DialogDescription>
            {editingLead ? 'Update lead information here.' : 'Add a new lead to your CRM.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead source" />
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about the lead"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{editingLead ? 'Update' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
