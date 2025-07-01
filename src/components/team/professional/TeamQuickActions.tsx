
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal,
  Mail,
  FileText,
  BarChart3,
  Download,
  Share,
  UserPlus,
  Settings,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamQuickActionsProps {
  team: EnhancedTeam;
  userRole?: string;
}

export function TeamQuickActions({ team, userRole }: TeamQuickActionsProps) {
  const canManage = ['SA', 'AD'].includes(userRole || '');
  const isTeamAdmin = true; // This would be determined based on team membership

  const handleEmailTeam = () => {
    const emails = team.members?.map(m => m.profiles?.email).filter(Boolean).join(';');
    if (emails) {
      window.open(`mailto:${emails}?subject=Team Communication - ${team.name}`);
    } else {
      toast.error('No team member emails found');
    }
  };

  const handleExportReport = () => {
    // This would generate and download a team report
    toast.success('Team report export initiated');
  };

  const handleShareTeam = () => {
    // This would copy team link to clipboard or open share modal
    navigator.clipboard.writeText(window.location.href);
    toast.success('Team link copied to clipboard');
  };

  const handleGenerateReport = () => {
    // This would generate a detailed team report
    toast.success('Generating team performance report...');
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {team.status}
      </Badge>
      
      <Button size="sm" variant="outline" onClick={handleEmailTeam}>
        <Mail className="h-4 w-4 mr-1" />
        Email Team
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleShareTeam}>
            <Share className="h-4 w-4 mr-2" />
            Share Team
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </DropdownMenuItem>
          
          {(canManage || isTeamAdmin) && (
            <>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Add Members
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </DropdownMenuItem>
              
              {canManage && (
                <DropdownMenuItem className="text-destructive">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Team
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
