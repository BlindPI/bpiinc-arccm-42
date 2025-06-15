
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
import type { Contact } from '@/types/crm';

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSuccess?: () => void;
}

export function CreateContactModal({ open, onOpenChange, contact, onSuccess }: CreateContactModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    title: contact?.title || '',
    department: contact?.department || '',
    contact_status: contact?.contact_status || 'active',
    preferred_contact_method: contact?.preferred_contact_method || 'email',
    notes: contact?.notes || ''
  });

  const { mutate: createContact, isPending: isCreating } = useMutation({
    mutationFn: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => 
      CRMService.createContact(data),
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create contact');
      console.error('Error creating contact:', error);
    }
  });

  const { mutate: updateContact, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<Contact>) => 
      CRMService.updateContact(contact!.id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to update contact');
      console.error('Error updating contact:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      department: '',
      contact_status: 'active',
      preferred_contact_method: 'email',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    const contactData = {
      ...formData,
      email: formData.email,
    };

    if (isEditing) {
      updateContact(contactData);
    } else {
      createContact(contactData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contact_status">Status</Label>
              <Select value={formData.contact_status} onValueChange={(value) => handleChange('contact_status', value)}>
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
              <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
              <Select value={formData.preferred_contact_method} onValueChange={(value) => handleChange('preferred_contact_method', value)}>
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
          </div>

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
              {isCreating || isUpdating ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
