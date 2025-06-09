
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Account } from '@/types/crm';

interface AccountFormProps {
  account?: Account | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'prospect' as const,
    account_status: 'active' as const,
    industry: '',
    company_size: '',
    website: '',
    phone: '',
    annual_revenue: 0,
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: 'Canada',
    notes: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name,
        account_type: account.account_type,
        account_status: account.account_status,
        industry: account.industry || '',
        company_size: account.company_size || '',
        website: account.website || '',
        phone: account.phone || '',
        annual_revenue: account.annual_revenue || 0,
        billing_address: account.billing_address || '',
        billing_city: account.billing_city || '',
        billing_state: account.billing_state || '',
        billing_postal_code: account.billing_postal_code || '',
        billing_country: account.billing_country || 'Canada',
        notes: account.notes || ''
      });
    }
  }, [account]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => CRMService.createAccount(data),
    onSuccess: () => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSave();
    },
    onError: (error) => {
      toast.error('Failed to create account: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => CRMService.updateAccount(account!.id, data),
    onSuccess: () => {
      toast.success('Account updated successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSave();
    },
    onError: (error) => {
      toast.error('Failed to update account: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_name.trim()) {
      toast.error('Account name is required');
      return;
    }

    if (account) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="account_name">Account Name *</Label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) => handleChange('account_name', e.target.value)}
          placeholder="Enter account name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Account Type</Label>
          <Select 
            value={formData.account_type} 
            onValueChange={(value) => handleChange('account_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="competitor">Competitor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account Status</Label>
          <Select 
            value={formData.account_status} 
            onValueChange={(value) => handleChange('account_status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            placeholder="Enter industry"
          />
        </div>
        <div>
          <Label htmlFor="company_size">Company Size</Label>
          <Select 
            value={formData.company_size} 
            onValueChange={(value) => handleChange('company_size', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="501-1000">501-1000 employees</SelectItem>
              <SelectItem value="1000+">1000+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="annual_revenue">Annual Revenue</Label>
        <Input
          id="annual_revenue"
          type="number"
          value={formData.annual_revenue}
          onChange={(e) => handleChange('annual_revenue', parseInt(e.target.value) || 0)}
          placeholder="Enter annual revenue"
        />
      </div>

      <div>
        <Label htmlFor="billing_address">Billing Address</Label>
        <Input
          id="billing_address"
          value={formData.billing_address}
          onChange={(e) => handleChange('billing_address', e.target.value)}
          placeholder="Enter billing address"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="billing_city">City</Label>
          <Input
            id="billing_city"
            value={formData.billing_city}
            onChange={(e) => handleChange('billing_city', e.target.value)}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="billing_state">Province/State</Label>
          <Input
            id="billing_state"
            value={formData.billing_state}
            onChange={(e) => handleChange('billing_state', e.target.value)}
            placeholder="Enter province/state"
          />
        </div>
        <div>
          <Label htmlFor="billing_postal_code">Postal Code</Label>
          <Input
            id="billing_postal_code"
            value={formData.billing_postal_code}
            onChange={(e) => handleChange('billing_postal_code', e.target.value)}
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Enter account notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}
