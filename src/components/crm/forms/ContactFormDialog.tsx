import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Contact, ContactStatus, PreferredContactMethod } from '@/types/supabase-schema';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  mode: 'create' | 'edit' | 'view';
}

export function ContactFormDialog({ open, onOpenChange, contact, mode }: ContactFormDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile_phone: '',
    title: '',
    department: '',
    contact_status: 'active' as ContactStatus,
    preferred_contact_method: 'email' as PreferredContactMethod,
    do_not_call: false,
    do_not_email: false,
    notes: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email,
        phone: contact.phone || '',
        mobile_phone: contact.mobile_phone || '',
        title: contact.title || '',
        department: contact.department || '',
        contact_status: contact.contact_status,
        preferred_contact_method: contact.preferred_contact_method || 'email',
        do_not_call: contact.do_not_call || false,
        do_not_email: contact.do_not_email || false,
        notes: contact.notes || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile_phone: '',
        title: '',
        department: '',
        contact_status: 'active',
        preferred_contact_method: 'email',
        do_not_call: false,
        do_not_email: false,
        notes: ''
      });
    }
  }, [contact, open]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => CRMService.createContact(data),
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
    mutationFn: (data: typeof formData) => CRMService.updateContact(contact!.id, data),
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
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (mode === 'edit') {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isReadOnly = mode === 'view';
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Contact' : 
             mode === 'edit' ? 'Edit Contact' : 
             'Contact Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => handleChange('mobile_phone', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter job title"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter department"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Status</Label>
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
            <div>
              <Label>Preferred Contact Method</Label>
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
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="do_not_call"
                checked={formData.do_not_call}
                onCheckedChange={(checked) => handleChange('do_not_call', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="do_not_call">Do Not Call</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="do_not_email"
                checked={formData.do_not_email}
                onCheckedChange={(checked) => handleChange('do_not_email', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="do_not_email">Do Not Email</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter contact notes..."
              rows={3}
            />
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Update Contact'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
