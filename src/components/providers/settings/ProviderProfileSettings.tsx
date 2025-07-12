import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Palette, Clock, MessageSquare } from 'lucide-react';
import { useProviderSettings } from '@/hooks/useProviderSettings';

export function ProviderProfileSettings() {
  const { settings, updateBranding, isUpdating } = useProviderSettings();
  const [formData, setFormData] = React.useState({
    display_name: '',
    branding_primary_color: '#2563eb',
    branding_secondary_color: '#64748b',
    preferred_communication_method: 'email',
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        display_name: settings.display_name || '',
        branding_primary_color: settings.branding_primary_color || '#2563eb',
        branding_secondary_color: settings.branding_secondary_color || '#64748b',
        preferred_communication_method: settings.preferred_communication_method || 'email',
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Provider Profile
          </CardTitle>
          <CardDescription>
            Configure your provider profile and business information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your organization name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="communication_method">Preferred Communication</Label>
                <Select 
                  value={formData.preferred_communication_method} 
                  onValueChange={(value) => handleInputChange('preferred_communication_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Profile Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & Theme
          </CardTitle>
          <CardDescription>
            Customize the appearance of your provider interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.branding_primary_color}
                  onChange={(e) => handleInputChange('branding_primary_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.branding_primary_color}
                  onChange={(e) => handleInputChange('branding_primary_color', e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.branding_secondary_color}
                  onChange={(e) => handleInputChange('branding_secondary_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.branding_secondary_color}
                  onChange={(e) => handleInputChange('branding_secondary_color', e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}