
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Globe, 
  BarChart3,
  Settings,
  TrendingUp
} from 'lucide-react';

interface TeamDashboardSelectorProps {
  currentMode: 'personal' | 'team' | 'organization';
  onModeChange: (mode: 'personal' | 'team' | 'organization') => void;
  currentTeam?: any;
  availableTeams: any[];
  onTeamChange?: (teamId: string) => void;
  userRole: string;
  isSystemAdmin: boolean;
}

export function TeamDashboardSelector({
  currentMode,
  onModeChange,
  currentTeam,
  availableTeams,
  onTeamChange,
  userRole,
  isSystemAdmin
}: TeamDashboardSelectorProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'personal':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Building2 className="h-4 w-4" />;
      case 'organization':
        return <Globe className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'personal':
        return 'Your individual metrics and activities';
      case 'team':
        return 'Team-specific data and performance metrics';
      case 'organization':
        return 'System-wide analytics and management';
      default:
        return '';
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Dashboard View Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dashboard Mode Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dashboard Scope</label>
          <Select value={currentMode} onValueChange={onModeChange}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                {getModeIcon(currentMode)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <div>
                    <div>Personal View</div>
                    <div className="text-xs text-muted-foreground">Individual metrics</div>
                  </div>
                </div>
              </SelectItem>
              {availableTeams.length > 0 && (
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div>Team View</div>
                      <div className="text-xs text-muted-foreground">Team-specific data</div>
                    </div>
                  </div>
                </SelectItem>
              )}
              {isSystemAdmin && (
                <SelectItem value="organization">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div>Organization View</div>
                      <div className="text-xs text-muted-foreground">System-wide analytics</div>
                    </div>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getModeDescription(currentMode)}
          </p>
        </div>

        {/* Team Selector (when in team mode) */}
        {currentMode === 'team' && availableTeams.length > 1 && onTeamChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Team</label>
            <Select value={currentTeam?.id} onValueChange={onTeamChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{team.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {team.role}
                        </Badge>
                        {team.location_name && (
                          <span>• {team.location_name}</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Context Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Current Role: <Badge variant="secondary">{userRole}</Badge>
          </div>
          {currentMode === 'team' && currentTeam && (
            <Button variant="ghost" size="sm">
              <Settings className="h-3 w-3 mr-1" />
              Team Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
