
import React from 'react';
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
                  onClick={() => onBulkAction(action.id, selectedTeams)}
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
