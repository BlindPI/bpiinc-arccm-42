
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Users, Crown, User } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamNode {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  children: TeamNode[];
  parentId?: string;
}

interface TeamMember {
  id: string;
  role: 'ADMIN' | 'MEMBER';
  profile: {
    display_name: string;
    role: string;
  };
}

export function TeamHierarchy() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['team-hierarchy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          parent_id,
          team_members(
            id,
            role,
            profiles(
              display_name,
              role
            )
          )
        `)
        .order('name');

      if (error) throw error;
      return buildTeamHierarchy(data);
    }
  });

  const buildTeamHierarchy = (flatTeams: any[]): TeamNode[] => {
    const teamMap = new Map<string, TeamNode>();
    const rootTeams: TeamNode[] = [];

    // First pass: create all team nodes
    flatTeams.forEach(team => {
      teamMap.set(team.id, {
        id: team.id,
        name: team.name,
        description: team.description,
        members: team.team_members || [],
        children: [],
        parentId: team.parent_id
      });
    });

    // Second pass: build hierarchy
    flatTeams.forEach(team => {
      const teamNode = teamMap.get(team.id)!;
      if (team.parent_id) {
        const parent = teamMap.get(team.parent_id);
        if (parent) {
          parent.children.push(teamNode);
        }
      } else {
        rootTeams.push(teamNode);
      }
    });

    return rootTeams;
  };

  const toggleExpanded = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const renderTeamNode = (team: TeamNode, level: number = 0) => {
    const isExpanded = expandedTeams.has(team.id);
    const hasChildren = team.children.length > 0;
    const adminMembers = team.members.filter(m => m.role === 'ADMIN');
    const regularMembers = team.members.filter(m => m.role === 'MEMBER');

    return (
      <div key={team.id} className="mb-2">
        <div 
          className={`p-4 border rounded-lg bg-white shadow-sm ${level > 0 ? 'ml-8' : ''}`}
          style={{ borderLeft: level > 0 ? '3px solid #3b82f6' : undefined }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(team.id)}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!hasChildren && <div className="w-6" />}
              
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
              </Badge>
              {hasChildren && (
                <Badge variant="secondary">
                  {team.children.length} subteam{team.children.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Team Members */}
          {team.members.length > 0 && (
            <div className="mt-4 space-y-2">
              {/* Admins */}
              {adminMembers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Team Admins
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {adminMembers.map(member => (
                      <Badge key={member.id} variant="default" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        {member.profile?.display_name || 'Unknown'}
                        <span className="text-xs opacity-75">({member.profile?.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Members */}
              {regularMembers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <User className="h-4 w-4 text-blue-500" />
                    Members
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {regularMembers.map(member => (
                      <Badge key={member.id} variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {member.profile?.display_name || 'Unknown'}
                        <span className="text-xs opacity-75">({member.profile?.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {team.children.map(child => renderTeamNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team hierarchy...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No teams found. Create your first team to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map(team => renderTeamNode(team))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
