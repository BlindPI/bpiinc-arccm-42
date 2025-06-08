
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StepLocationProviderProps {
  formData: {
    location_id: string;
    provider_id: string;
  };
  onUpdateFormData: (data: Partial<typeof formData>) => void;
  userRole: string;
  errors: Record<string, string>;
}

export function StepLocationProvider({ formData, onUpdateFormData, userRole, errors }: StepLocationProviderProps) {
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('id, name, provider_type, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: ['SA', 'AD', 'AP'].includes(userRole)
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="location">Primary Location</Label>
            <Select 
              value={formData.location_id} 
              onValueChange={(value) => onUpdateFormData({ location_id: value })}
            >
              <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location_id && (
              <p className="text-sm text-red-600">{errors.location_id}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {['SA', 'AD', 'AP'].includes(userRole) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Provider Association
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="provider">Authorized Provider (Optional)</Label>
              <Select 
                value={formData.provider_id} 
                onValueChange={(value) => onUpdateFormData({ provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Provider Association</SelectItem>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id.toString()} value={provider.id.toString()}>
                      {provider.name} ({provider.provider_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
