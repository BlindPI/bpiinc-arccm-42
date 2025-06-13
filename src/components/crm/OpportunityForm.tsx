
import React from 'react';
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
import { Loader2, Target, DollarSign } from 'lucide-react';
import type { Opportunity } from '@/types/crm';

const opportunitySchema = z.object({
  opportunity_name: z.string().min(1, 'Opportunity name is required'),
  estimated_value: z.number().min(0, 'Value must be positive'),
  stage: z.enum(['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  expected_close_date: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  lead_source: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSave: (data: OpportunityFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OpportunityForm({ opportunity, onSave, onCancel, isLoading }: OpportunityFormProps) {
  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      opportunity_name: opportunity?.opportunity_name || '',
      estimated_value: opportunity?.estimated_value || 0,
      stage: opportunity?.stage || 'prospect',
      probability: opportunity?.probability || 25,
      expected_close_date: opportunity?.expected_close_date || '',
      description: opportunity?.description || '',
      type: opportunity?.type || 'training_contract',
      lead_source: opportunity?.lead_source || '',
    },
  });

  const handleSubmit = (data: OpportunityFormData) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">
            {opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
          </h3>
        </div>

        {/* Essential Fields */}
        <FormField
          control={form.control}
          name="opportunity_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opportunity Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter opportunity name"
                  {...field}
                  className="text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Value ($) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="50000"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
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
                <FormLabel>Probability (%) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="75"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="prospect">🔍 Prospect</SelectItem>
                    <SelectItem value="proposal">📋 Proposal</SelectItem>
                    <SelectItem value="negotiation">🤝 Negotiation</SelectItem>
                    <SelectItem value="closed_won">✅ Closed Won</SelectItem>
                    <SelectItem value="closed_lost">❌ Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_close_date"
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opportunity Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="training_contract">🎓 Training Contract</SelectItem>
                  <SelectItem value="certification">📜 Certification</SelectItem>
                  <SelectItem value="consulting">💼 Consulting</SelectItem>
                  <SelectItem value="equipment">🛠️ Equipment Sales</SelectItem>
                  <SelectItem value="other">📦 Other</SelectItem>
                </SelectContent>
              </Select>
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
                <Textarea
                  placeholder="Describe the opportunity, key requirements, and next steps..."
                  {...field}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="sm:w-auto w-full">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="sm:w-auto w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {opportunity ? 'Update' : 'Create'} Opportunity
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
