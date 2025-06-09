
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthorizedProviderService } from '@/services/provider/authorizedProviderService';

interface TeamCreationWizardProps {
  onTeamCreated?: (teamId: string) => void;
  onCancel?: () => void;
}

export function TeamCreationWizard() {
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => AuthorizedProviderService.getProviders()
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'operational',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProviderSelect = (provider: any) => {
    setSelectedProvider(provider);
  };

  const handleSubmit = () => {
    // Handle team creation logic here
    console.log('Creating team with data:', {
      ...formData,
      provider_id: selectedProvider?.id
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Type</label>
            <Input
              type="text"
              name="team_type"
              value={formData.team_type}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Provider</label>
            <select
              onChange={(e) => {
                const provider = providers.find(p => p.id === e.target.value);
                handleProviderSelect(provider);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a provider</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        
          {selectedProvider && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Selected Provider</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedProvider.name}</p>
                <p><strong>Type:</strong> {selectedProvider.provider_type}</p>
                <p><strong>Performance:</strong> {selectedProvider.performance_rating || 0}/5</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {}}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Team</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
