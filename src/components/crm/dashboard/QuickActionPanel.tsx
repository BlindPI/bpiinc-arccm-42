
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Building, 
  Target,
  FileText,
  Clock,
  Zap
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  count?: number;
}

export function QuickActionPanel() {
  const [recentActions, setRecentActions] = useState<string[]>([]);

  const handleQuickAction = (actionId: string, action: () => void) => {
    action();
    setRecentActions(prev => [actionId, ...prev.slice(0, 4)]);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-lead',
      title: 'Create Lead',
      description: 'Add a new potential customer',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-blue-500 text-white',
      action: () => console.log('Create lead'),
      count: 12
    },
    {
      id: 'schedule-call',
      title: 'Schedule Call',
      description: 'Book a follow-up call',
      icon: <Phone className="h-5 w-5" />,
      color: 'bg-green-500 text-white',
      action: () => console.log('Schedule call'),
      count: 3
    },
    {
      id: 'send-email',
      title: 'Send Email',
      description: 'Send personalized email',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-purple-500 text-white',
      action: () => console.log('Send email'),
      count: 8
    },
    {
      id: 'create-meeting',
      title: 'Create Meeting',
      description: 'Schedule a new meeting',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-orange-500 text-white',
      action: () => console.log('Create meeting')
    },
    {
      id: 'add-contact',
      title: 'Add Contact',
      description: 'Create new contact',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-indigo-500 text-white',
      action: () => console.log('Add contact')
    },
    {
      id: 'create-account',
      title: 'Create Account',
      description: 'Add new company account',
      icon: <Building className="h-5 w-5" />,
      color: 'bg-red-500 text-white',
      action: () => console.log('Create account')
    },
    {
      id: 'log-activity',
      title: 'Log Activity',
      description: 'Record an interaction',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-yellow-500 text-white',
      action: () => console.log('Log activity')
    },
    {
      id: 'create-opportunity',
      title: 'Create Opportunity',
      description: 'Add sales opportunity',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-teal-500 text-white',
      action: () => console.log('Create opportunity')
    }
  ];

  const workflowTemplates = [
    {
      name: 'Lead Qualification',
      description: 'Standard lead qualification process',
      steps: 5,
      estimated: '15 min'
    },
    {
      name: 'Follow-up Sequence',
      description: 'Automated follow-up workflow',
      steps: 3,
      estimated: '5 min'
    },
    {
      name: 'Deal Closing',
      description: 'Final steps to close a deal',
      steps: 7,
      estimated: '30 min'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used actions for faster workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => handleQuickAction(action.id, action.action)}
                className="h-auto p-4 flex flex-col items-center gap-2 relative group hover:shadow-md transition-all"
              >
                <div className={`p-3 rounded-full ${action.color} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
                {action.count && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                    {action.count}
                  </Badge>
                )}
                {recentActions.includes(action.id) && (
                  <Badge variant="success" className="absolute -top-1 -left-1 text-xs">
                    Recent
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Templates</CardTitle>
          <CardDescription>
            Pre-built workflows to streamline common processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowTemplates.map((template, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {template.steps} steps
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      ~{template.estimated}
                    </div>
                  </div>
                </div>
                <Button size="sm">Start Workflow</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Actions */}
      {recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Your recently used quick actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {recentActions.map((actionId, index) => {
                const action = quickActions.find(a => a.id === actionId);
                return action ? (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {action.icon}
                    {action.title}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
