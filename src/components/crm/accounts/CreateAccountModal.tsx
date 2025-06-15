
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Account } from '@/types/crm';

interface CreateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  onSuccess?: () => void;
}

export function CreateAccountModal({ open, onOpenChange, account, onSuccess }: CreateAccountModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!account;

  const [formData, setFormData] = useState({
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'prospect',
    account_status: account?.account_status || 'active',
    industry: account?.industry || '',
    company_size: account?.company_size || '',
    website: account?.website || '',
    phone: account?.phone || '',
    annual_revenue: account?.annual_revenue || 0,
    billing_address: account?.billing_address || '',
    billing_city: account?.billing_city || '',
    billing_state: account?.billing_state || '',
    billing_postal_code: account?.billing_postal_code || '',
    billing_country: account?.billing_country || '',
    notes: account?.notes || ''
  });

  const { mutate: createAccount, isPending: isCreating } = useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => 
      CRMService.createAccount(data),
    onSuccess: () => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create account');
      console.error('Error creating account:', error);
    }
  });

  const { mutate: updateAccount, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<Account>) => 
      CRMService.updateAccount(account!.id, data),
    onSuccess: () => {
      toast.success('Account updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to update account');
      console.error('Error updating account:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      account_name: '',
      account_type: 'prospect',
      account_status: 'active',
      industry: '',
      company_size: '',
      website: '',
      phone: '',
      annual_revenue: 0,
      billing_address: '',
      billing_city: '',
      billing_state: '',
      billing_postal_code: '',
      billing_country: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_name.trim()) {
      toast.error('Account name is required');
      return;
    }

    const accountData = formData;

    if (isEditing) {
      updateAccount(accountData);
    } else {
      createAccount(accountData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Create New Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => handleChange('account_name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="account_type">Account Type</Label>
                <Select value={formData.account_type} onValueChange={(value) => handleChange('account_type', value)}>
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
                <Label htmlFor="account_status">Status</Label>
                <Select value={formData.account_status} onValueChange={(value) => handleChange('account_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <Select value={formData.company_size} onValueChange={(value) => handleChange('company_size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="annual_revenue">Annual Revenue ($)</Label>
                <Input
                  id="annual_revenue"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.annual_revenue}
                  onChange={(e) => handleChange('annual_revenue', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="billing_address">Street Address</Label>
                <Input
                  id="billing_address"
                  value={formData.billing_address}
                  onChange={(e) => handleChange('billing_address', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="billing_city">City</Label>
                <Input
                  id="billing_city"
                  value={formData.billing_city}
                  onChange={(e) => handleChange('billing_city', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="billing_state">State/Province</Label>
                <Input
                  id="billing_state"
                  value={formData.billing_state}
                  onChange={(e) => handleChange('billing_state', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="billing_postal_code">Postal Code</Label>
                <Input
                  id="billing_postal_code"
                  value={formData.billing_postal_code}
                  onChange={(e) => handleChange('billing_postal_code', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="billing_country">Country</Label>
                <Input
                  id="billing_country"
                  value={formData.billing_country}
                  onChange={(e) => handleChange('billing_country', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
