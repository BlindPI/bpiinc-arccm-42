
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
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
import type { Account } from '@/types/crm';

const accountFormSchema = z.object({
  account_name: z.string().min(1, 'Account name is required'),
  account_type: z.enum(['prospect', 'customer', 'partner', 'competitor']),
  account_status: z.enum(['active', 'inactive']),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_postal_code: z.string().optional(),
  annual_revenue: z.number().optional(),
  notes: z.string().optional()
});

type AccountFormData = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export function AccountForm({ 
  account, 
  onSubmit, 
  onCancel, 
  isLoading,
  mode = 'create' 
}: AccountFormProps) {
  const isReadOnly = mode === 'view';

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      account_name: account?.account_name || '',
      account_type: account?.account_type || 'prospect',
      account_status: account?.account_status || 'active',
      industry: account?.industry || '',
      company_size: account?.company_size || '',
      website: account?.website || '',
      phone: account?.phone || '',
      billing_address: account?.billing_address || '',
      billing_city: account?.billing_city || '',
      billing_state: account?.billing_state || '',
      billing_postal_code: account?.billing_postal_code || '',
      annual_revenue: account?.annual_revenue || undefined,
      notes: account?.notes || ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name *</FormLabel>
              <FormControl>
                <Input {...field} disabled={isReadOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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
            name="account_status"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isReadOnly} />
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

        <FormField
          control={form.control}
          name="billing_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Address</FormLabel>
              <FormControl>
                <Input {...field} disabled={isReadOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="billing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="annual_revenue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Revenue</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isReadOnly} 
                />
              </FormControl>
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
                <Textarea {...field} rows={3} disabled={isReadOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isReadOnly && (
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {mode === 'create' ? 'Create Account' : 'Update Account'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
