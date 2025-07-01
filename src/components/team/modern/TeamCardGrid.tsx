import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Settings, 
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamCardGridProps {
  teams: EnhancedTeam[];
  onTeamSelect?: (team: EnhancedTeam) => void;
  onTeamEdit?: (team: EnhancedTeam) => void;
  onTeamDelete?: (team: EnhancedTeam) => void;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function TeamCardGrid({
  teams,
  onTeamSelect,
  onTeamEdit,
  onTeamDelete,
  loading = false,
  viewMode = 'grid',
  onViewModeChange
}: TeamCardGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    const matchesType = typeFilter === 'all' || team.team_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <AlertCircle className="h-3 w-3" />;
      case 'suspended': return <AlertCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const uniqueStatuses = [...new Set(teams.map(team => team.status))];
  const uniqueTypes = [...new Set(teams.map(team => team.team_type))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueStatuses.map(status => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="capitalize">{status}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueTypes.map(type => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredTeams.length} of {teams.length} teams
      </div>

      {/* Team Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
      )}>
        {filteredTeams.map((team) => (
          <Card 
            key={team.id} 
            className={cn(
              "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-200",
              viewMode === 'list' && "flex flex-row"
            )}
            onClick={() => onTeamSelect?.(team)}
          >
            <CardHeader className={cn(
              "pb-3",
              viewMode === 'list' && "flex-shrink-0 w-1/3"
            )}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                    {team.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", getStatusColor(team.status))}>
                      {getStatusIcon(team.status)}
                      <span className="ml-1 capitalize">{team.status}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {team.team_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onTeamSelect?.(team);
                    }}>
                      <Users className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {onTeamEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onTeamEdit(team);
                      }}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Team
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onTeamDelete && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTeamDelete(team);
                        }}
                      >
                        Delete Team
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className={cn(
              "space-y-4",
              viewMode === 'list' && "flex-1"
            )}>
              {team.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {team.description}
                </p>
              )}
              
              <div className="space-y-3">
                {/* Location */}
                {team.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{team.location.name}</span>
                  </div>
                )}
                
                {/* Members Count */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {team.member_count || team.members?.length || 0} members
                  </span>
                </div>
                
                {/* Performance Score */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Performance:</span>
                  <span className={cn("font-medium", getPerformanceColor(team.performance_score))}>
                    {team.performance_score}%
                  </span>
                  {team.performance_score >= 80 && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className={cn(
                "flex gap-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity",
                viewMode === 'list' && "opacity-100"
              )}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTeamSelect?.(team);
                  }}
                >
                  <Users className="h-3 w-3 mr-1" />
                  View
                </Button>
                {onTeamEdit && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTeamEdit(team);
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTeams.length === 0 && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Users className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No teams found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first team'
                }
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}