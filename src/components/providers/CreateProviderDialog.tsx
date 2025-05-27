
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from '@tanstack/react-query';
import { authorizedProviderService, type ProviderRegistrationData } from '@/services/provider/authorizedProviderService';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateProviderDialogProps {
  onProviderCreated: () => void;
}

export function CreateProviderDialog({ onProviderCreated }: CreateProviderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ProviderRegistrationData>({
    name: '',
    provider_name: '',
    provider_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    description: '',
    primary_location_id: '',
    provider_type: 'training_provider',
    certification_levels: [],
    specializations: []
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createProviderMutation = useMutation({
    mutationFn: () => authorizedProviderService.createProvider(formData),
    onSuccess: () => {
      toast.success('Provider registration submitted for approval');
      setIsOpen(false);
      setFormData({
        name: '',
        provider_name: '',
        provider_url: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        description: '',
        primary_location_id: '',
        provider_type: 'training_provider',
        certification_levels: [],
        specializations: []
      });
      onProviderCreated();
    },
    onError: (error) => {
      toast.error(`Failed to register provider: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact_email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    createProviderMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Register Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Authorized Provider</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name..."
                required
              />
            </div>

            <div>
              <Label htmlFor="provider_name">Provider Display Name *</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="Enter provider display name..."
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the provider's services and capabilities..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@provider.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="provider_url">Website URL</Label>
            <Input
              id="provider_url"
              value={formData.provider_url}
              onChange={(e) => setFormData({ ...formData, provider_url: e.target.value })}
              placeholder="https://provider.com"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider_type">Provider Type</Label>
              <Select value={formData.provider_type} onValueChange={(value) => setFormData({ ...formData, provider_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training_provider">Training Provider</SelectItem>
                  <SelectItem value="certification_body">Certification Body</SelectItem>
                  <SelectItem value="educational_institution">Educational Institution</SelectItem>
                  <SelectItem value="corporate_training">Corporate Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primary_location_id">Primary Location</Label>
              <Select value={formData.primary_location_id} onValueChange={(value) => setFormData({ ...formData, primary_location_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.city && `• ${location.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProviderMutation.isPending}>
              {createProviderMutation.isPending ? 'Registering...' : 'Register Provider'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
