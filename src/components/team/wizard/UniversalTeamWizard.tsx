
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Crown, Building2, Shield } from 'lucide-react';

interface UniversalTeamWizardProps {
  userRole?: string;
}

export function UniversalTeamWizard({ userRole }: UniversalTeamWizardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getWizardConfig = () => {
    switch (userRole) {
      case 'SA':
        return {
          title: 'System Administrator Team Creation',
          description: 'Create teams with full system privileges and advanced configuration options',
          icon: Crown,
          variant: 'default' as const,
          features: ['Full system access', 'Enterprise features', 'Cross-location teams', 'Advanced governance']
        };
      case 'AD':
        return {
          title: 'Administrator Team Creation',
          description: 'Create and manage teams within your administrative scope',
          icon: Shield,
          variant: 'default' as const,
          features: ['Administrative control', 'Team governance', 'Member management', 'Analytics access']
        };
      case 'AP':
        return {
          title: 'Provider Team Creation',
          description: 'Create teams for your authorized provider organization',
          icon: Building2,
          variant: 'secondary' as const,
          features: ['Provider scope', 'Team management', 'Performance tracking', 'Training coordination']
        };
      default:
        return {
          title: 'Team Creation',
          description: 'Create a new team for collaboration and training',
          icon: Users,
          variant: 'outline' as const,
          features: ['Basic team features', 'Member collaboration', 'Activity tracking', 'Communication tools']
        };
    }
  };

  const config = getWizardConfig();
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onModal={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={config.variant}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {config.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>
              {userRole || 'User'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {config.description}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Available Features</h4>
              <div className="space-y-1">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Team Configuration</h4>
              <div className="text-sm text-muted-foreground">
                Configure team settings, assign members, set up governance rules, and define team objectives based on your role permissions.
              </div>
            </div>
          </div>

          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Team Creation Wizard</h3>
            <p>Step-by-step team setup will be implemented here</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button>
              Start Team Creation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
