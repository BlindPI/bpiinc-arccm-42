
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MoreHorizontal, Users, MapPin, Calendar, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  created_at: string;
  locations?: {
    name: string;
    city?: string;
    state?: string;
  };
  member_count: number;
}

interface TeamTableProps {
  teams: Team[];
  selectedTeams: string[];
  onSelectTeams: (teams: string[]) => void;
  isLoading: boolean;
}

export function TeamTable({ teams, selectedTeams, onSelectTeams, isLoading }: TeamTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectTeams(teams.map(t => t.id));
    } else {
      onSelectTeams([]);
    }
  };

  const handleSelectTeam = (teamId: string, checked: boolean) => {
    if (checked) {
      onSelectTeams([...selectedTeams, teamId]);
    } else {
      onSelectTeams(selectedTeams.filter(id => id !== teamId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'provider_team':
        return 'bg-blue-100 text-blue-800';
      case 'training_team':
        return 'bg-purple-100 text-purple-800';
      case 'operations':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTeams.length === teams.length && teams.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Team Name</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Members</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Performance</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow 
                key={team.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedTeams.includes(team.id)}
                    onCheckedChange={(checked) => handleSelectTeam(team.id, !!checked)}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{team.name}</div>
                    {team.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {team.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {team.locations?.name || 'No location assigned'}
                    </span>
                  </div>
                  {team.locations?.city && (
                    <div className="text-xs text-gray-500 ml-6">
                      {team.locations.city}, {team.locations.state}
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {team.member_count}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getTypeColor(team.team_type || 'standard')}>
                    {team.team_type?.replace('_', ' ') || 'Standard'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(team.status)}>
                    {team.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {team.performance_score?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(team.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Team</DropdownMenuItem>
                      <DropdownMenuItem>Manage Members</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Export Data</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Deactivate Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-500">Get started by creating your first team.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
