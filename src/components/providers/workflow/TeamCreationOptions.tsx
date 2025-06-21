
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Users } from 'lucide-react';
import type { WorkflowData } from '../APProviderAssignmentWorkflow';

interface TeamCreationOptionsProps {
  providerName?: string;
  teamName?: string;
  createProvider: boolean;
  createTeam: boolean;
  onUpdate: (updates: Partial<WorkflowData>) => void;
}

export function TeamCreationOptions({
  providerName,
  teamName,
  createProvider,
  createTeam,
  onUpdate
}: TeamCreationOptionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Provider & Team</h3>
        <p className="text-muted-foreground">
          Set up the provider name and team configuration for this assignment.
        </p>
      </div>

      <div className="space-y-6">
        {/* Provider Configuration */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Provider Configuration</h4>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Create Provider Record</Label>
                <p className="text-sm text-muted-foreground">
                  Create a new authorized provider entry for the selected AP user
                </p>
              </div>
              <Switch
                checked={createProvider}
                onCheckedChange={(checked) => onUpdate({ createProvider: checked })}
              />
            </div>

            {createProvider && (
              <div className="space-y-2">
                <Label htmlFor="provider-name">Provider Name *</Label>
                <Input
                  id="provider-name"
                  value={providerName || ''}
                  onChange={(e) => onUpdate({ providerName: e.target.value })}
                  placeholder="Enter provider/company name"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be the official name for the authorized provider
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Configuration */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Team Configuration</h4>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Create Provider Team</Label>
                <p className="text-sm text-muted-foreground">
                  Create a team at the selected location managed by this provider
                </p>
              </div>
              <Switch
                checked={createTeam}
                onCheckedChange={(checked) => onUpdate({ createTeam: checked })}
              />
            </div>

            {createTeam && (
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName || ''}
                  onChange={(e) => onUpdate({ teamName: e.target.value })}
                  placeholder={providerName ? `${providerName} Team` : 'Provider Team'}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-generate based on provider and location names
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Configuration Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Provider Record:</span>
                <span className={createProvider ? 'text-green-600' : 'text-muted-foreground'}>
                  {createProvider ? 'Will be created' : 'Skip creation'}
                </span>
              </div>
              {createProvider && providerName && (
                <div className="flex justify-between">
                  <span className="ml-4">Provider Name:</span>
                  <span className="font-medium">{providerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Provider Team:</span>
                <span className={createTeam ? 'text-green-600' : 'text-muted-foreground'}>
                  {createTeam ? 'Will be created' : 'Skip creation'}
                </span>
              </div>
              {createTeam && (
                <div className="flex justify-between">
                  <span className="ml-4">Team Name:</span>
                  <span className="font-medium">
                    {teamName || (providerName ? `${providerName} Team` : 'Auto-generated')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
