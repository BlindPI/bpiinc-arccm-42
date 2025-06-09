
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
import type { Contact } from '@/types/crm';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  mode: 'create' | 'edit' | 'view';
}

export function ContactFormDialog({ open, onOpenChange, contact, mode }: ContactFormDialogProps) {
  const queryClient = useQueryClient();
  const isReadOnly = mode === 'view';

  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile_phone: contact?.mobile_phone || '',
    title: contact?.title || '',
    department: contact?.department || '',
    contact_status: contact?.contact_status || 'active',
    preferred_contact_method: contact?.preferred_contact_method || 'email',
    account_id: contact?.account_id || '',
    notes: contact?.notes || ''
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => 
      CRMService.createContact(data),
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => 
      CRMService.updateContact(contact!.id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update contact: ' + error.message);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Contact' : 
             mode === 'edit' ? 'Edit Contact' : 'View Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => handleChange('mobile_phone', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="contact_status">Status</Label>
              <Select 
                value={formData.contact_status} 
                onValueChange={(value) => handleChange('contact_status', value)}
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

          <div>
            <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
            <Select 
              value={formData.preferred_contact_method} 
              onValueChange={(value) => handleChange('preferred_contact_method', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
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
                {mode === 'create' ? 'Create Contact' : 'Update Contact'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
