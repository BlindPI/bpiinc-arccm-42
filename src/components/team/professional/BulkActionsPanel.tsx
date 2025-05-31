
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Download, 
  Mail, 
  Archive,
  AlertCircle 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkActionsPanelProps {
  selectedCount: number;
  selectedTeams: string[];
  onBulkAction: (action: string, teamIds: string[]) => void;
}

export function BulkActionsPanel({ 
  selectedCount, 
  selectedTeams, 
  onBulkAction 
}: BulkActionsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, teamIds }: { action: string; teamIds: string[] }) => {
      setIsLoading(true);
      
      switch (action) {
        case 'activate':
          const { error: activateError } = await supabase
            .from('teams')
            .update({ status: 'active' })
            .in('id', teamIds);
          if (activateError) throw activateError;
          break;
          
        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('teams')
            .update({ status: 'inactive' })
            .in('id', teamIds);
          if (deactivateError) throw deactivateError;
          break;
          
        case 'archive':
          const { error: archiveError } = await supabase
            .from('teams')
            .update({ status: 'archived' })
            .in('id', teamIds);
          if (archiveError) throw archiveError;
          break;
          
        case 'notify':
          // This would typically call an edge function to send notifications
          console.log('Sending notifications to teams:', teamIds);
          // Simulate notification sending
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
          
        case 'export':
          // Handle export in the calling component
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
    onSuccess: (_, { action }) => {
      const actionLabels = {
        activate: 'activated',
        deactivate: 'deactivated',
        archive: 'archived',
        notify: 'notified'
      };
      
      toast.success(`Successfully ${actionLabels[action as keyof typeof actionLabels]} ${selectedCount} team(s)`);
      queryClient.invalidateQueries({ queryKey: ['teams-professional'] });
    },
    onError: (error, { action }) => {
      toast.error(`Failed to ${action} teams: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleBulkAction = async (action: string) => {
    if (action === 'export') {
      onBulkAction(action, selectedTeams);
      return;
    }
    
    bulkUpdateMutation.mutate({ action, teamIds: selectedTeams });
  };

  const actions = [
    {
      id: 'activate',
      label: 'Activate',
      icon: CheckCircle,
      variant: 'default' as const,
      description: 'Activate selected teams'
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: XCircle,
      variant: 'outline' as const,
      description: 'Deactivate selected teams'
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline' as const,
      description: 'Export team data'
    },
    {
      id: 'notify',
      label: 'Send Notification',
      icon: Mail,
      variant: 'outline' as const,
      description: 'Send notification to team members'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'outline' as const,
      description: 'Archive selected teams'
    }
  ];

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-900">Bulk Actions</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {selectedCount} teams selected
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleBulkAction(action.id)}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                  title={action.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 text-sm text-orange-700">
          Select an action to apply to all {selectedCount} selected teams. 
          Changes will take effect immediately.
        </div>
      </CardContent>
    </Card>
  );
}
