import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UserPlus,
  Target,
  Calendar,
  Mail,
  FileText,
  Phone
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Lead',
      description: 'Create new lead',
      icon: UserPlus,
      href: '/crm/leads/create',
      variant: 'default' as const
    },
    {
      title: 'New Opportunity',
      description: 'Create opportunity',
      icon: Target,
      href: '/crm/opportunities/create',
      variant: 'outline' as const
    },
    {
      title: 'Schedule Call',
      description: 'Book meeting',
      icon: Calendar,
      href: '/crm/activities/create?type=call',
      variant: 'outline' as const
    },
    {
      title: 'Send Email',
      description: 'Email campaign',
      icon: Mail,
      href: '/crm/campaigns/create',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.href}
            variant={action.variant}
            size="sm"
            onClick={() => navigate(action.href)}
            className="flex items-center space-x-2"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{action.title}</span>
          </Button>
        );
      })}
    </div>
  );
};