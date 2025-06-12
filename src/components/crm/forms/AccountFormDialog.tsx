
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import type { Account } from '@/types/crm';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  mode: 'create' | 'edit' | 'view';
}

export function AccountFormDialog({ open, onOpenChange, account, mode }: AccountFormDialogProps) {
  const queryClient = useQueryClient();
  const isReadOnly = mode === 'view';

  const [formData, setFormData] = useState({
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
    annual_revenue: account?.annual_revenue || 0,
    notes: account?.notes || ''
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => 
      CRMService.createAccount(data),
    onSuccess: () => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create account: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Account>) => 
      CRMService.updateAccount(account!.id, data),
    onSuccess: () => {
      toast.success('Account updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update account: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (mode === 'edit') {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Account' : 
             mode === 'edit' ? 'Edit Account' : 'View Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="account_name">Account Name *</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => handleChange('account_name', e.target.value)}
              required
              readOnly={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account_type">Account Type</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value) => handleChange('account_type', value)}
                disabled={isReadOnly}
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
              <Label htmlFor="account_status">Status</Label>
              <Select 
                value={formData.account_status} 
                onValueChange={(value) => handleChange('account_status', value)}
                disabled={isReadOnly}
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
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="company_size">Company Size</Label>
              <Input
                id="company_size"
                value={formData.company_size}
                onChange={(e) => handleChange('company_size', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billing_address">Billing Address</Label>
            <Input
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => handleChange('billing_address', e.target.value)}
              readOnly={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="billing_city">City</Label>
              <Input
                id="billing_city"
                value={formData.billing_city}
                onChange={(e) => handleChange('billing_city', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="billing_state">State</Label>
              <Input
                id="billing_state"
                value={formData.billing_state}
                onChange={(e) => handleChange('billing_state', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="billing_postal_code">Postal Code</Label>
              <Input
                id="billing_postal_code"
                value={formData.billing_postal_code}
                onChange={(e) => handleChange('billing_postal_code', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="annual_revenue">Annual Revenue</Label>
            <Input
              id="annual_revenue"
              type="number"
              value={formData.annual_revenue}
              onChange={(e) => handleChange('annual_revenue', Number(e.target.value))}
              readOnly={isReadOnly}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              readOnly={isReadOnly}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === 'create' ? 'Create Account' : 'Update Account'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
