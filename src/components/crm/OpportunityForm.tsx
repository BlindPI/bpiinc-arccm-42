
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CRMService, Opportunity } from '@/services/crm/crmService';
import { toast } from 'sonner';

const opportunityFormSchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  stage: z.enum(['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  close_date: z.string().min(1, 'Close date is required'),
  account_name: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormProps {
  opportunity?: Opportunity | null;
  onSave: () => void;
  onCancel: () => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({ 
  opportunity, 
  onSave, 
  onCancel 
}) => {
  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      name: opportunity?.name || '',
      description: opportunity?.description || '',
      value: opportunity?.value || 0,
      stage: opportunity?.stage || 'prospect',
      probability: opportunity?.probability || 50,
      close_date: opportunity?.close_date || '',
      account_name: opportunity?.account_name || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: CRMService.createOpportunity,
    onSuccess: () => {
      toast.success('Opportunity created successfully');
      onSave();
    },
    onError: () => {
      toast.error('Failed to create opportunity');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Opportunity> }) =>
      CRMService.updateOpportunity(id, data),
    onSuccess: () => {
      toast.success('Opportunity updated successfully');
      onSave();
    },
    onError: () => {
      toast.error('Failed to update opportunity');
    },
  });

  const onSubmit = (data: OpportunityFormData) => {
    if (opportunity) {
      updateMutation.mutate({ id: opportunity.id, data });
    } else {
      createMutation.mutate(data as Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opportunity Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Acme Corp Training Contract" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <FormField
            control={form.control}
            name="close_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Close Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Company or organization name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : opportunity ? 'Update Opportunity' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
