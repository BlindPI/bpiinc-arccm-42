
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import { CRMService } from '@/services/crm/enhancedCRMService';
import type { Contact } from '@/types/crm';
import { toast } from 'sonner';

interface ContactFormProps {
  contact?: Contact;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onCancel,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile_phone: contact?.mobile_phone || '',
    title: contact?.title || '',
    department: contact?.department || '',
    contact_status: contact?.contact_status || 'active' as const,
    preferred_contact_method: contact?.preferred_contact_method || 'email' as const,
    do_not_call: contact?.do_not_call || false,
    do_not_email: contact?.do_not_email || false,
    notes: contact?.notes || ''
  });

  const queryClient = useQueryClient();

  const { mutate: saveContact, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (contact) {
        // Update existing contact - would need updateContact method
        throw new Error('Update not implemented yet');
      } else {
        return CRMService.createContact(data as Partial<Contact>);
      }
    },
    onSuccess: () => {
      toast.success(contact ? 'Contact updated successfully' : 'Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to save contact: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContact(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contact ? 'Edit Contact' : 'Create Contact'}</CardTitle>
        <CardDescription>
          {contact ? 'Update contact information' : 'Add a new contact to your CRM'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact_status">Status</Label>
              <Select value={formData.contact_status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, contact_status: value })}>
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
              <Select value={formData.preferred_contact_method} onValueChange={(value: 'email' | 'phone' | 'mobile') => setFormData({ ...formData, preferred_contact_method: value })}>
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
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="do_not_call"
                checked={formData.do_not_call}
                onCheckedChange={(checked) => setFormData({ ...formData, do_not_call: checked })}
              />
              <Label htmlFor="do_not_call">Do Not Call</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="do_not_email"
                checked={formData.do_not_email}
                onCheckedChange={(checked) => setFormData({ ...formData, do_not_email: checked })}
              />
              <Label htmlFor="do_not_email">Do Not Email</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : (contact ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
