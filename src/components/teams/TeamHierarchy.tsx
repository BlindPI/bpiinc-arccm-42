
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";

interface TeamTree {
  [key: string]: Team & { children: TeamTree };
}

interface Team {
  id: string;
  name: string;
  parent_id?: string;
}

const TeamHierarchy: React.FC = () => {
  const { teams, isLoading, addTeam, isAdding } = useTeams();
  const [teamTree, setTeamTree] = useState<TeamTree>({});

  const buildTree = useCallback((items: Team[]): TeamTree => {
    const map: TeamTree = {};
    const tree: TeamTree = {};

    items.forEach(item => {
      map[item.id] = { ...item, children: {} };
    });

    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children[item.id] = map[item.id];
      } else {
        tree[item.id] = map[item.id];
      }
    });

    return tree;
  }, []);

  useEffect(() => {
    if (teams) {
      setTeamTree(buildTree(teams));
    }
  }, [teams, buildTree]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamAdder onAdd={addTeam} teams={teams || []} isAdding={isAdding} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <TeamList tree={teamTree} />
        </CardContent>
      </Card>
    </div>
  );
};

const TeamList: React.FC<{ tree: TeamTree }> = ({ tree }) => {
  const items = Object.values(tree);
  const stack = [...items.map(item => ({ item, depth: 0 }))];
  const elements: JSX.Element[] = [];

  while (stack.length > 0) {
    const { item, depth } = stack.pop()!;

    elements.push(
      <div 
        key={item.id} 
        className="p-4 border-l-2 border-primary/20 hover:border-primary transition-colors"
        style={{ marginLeft: `${depth * 2}rem` }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <span className="text-sm text-muted-foreground">
            {Object.keys(item.children).length} subteam{Object.keys(item.children).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );

    Object.values(item.children).reverse().forEach(child => {
      stack.push({ item: child, depth: depth + 1 });
    });
  }

  return (
    <div className="space-y-2">
      {elements.length > 0 ? (
        elements
      ) : (
        <p className="text-muted-foreground text-center py-4">
          No teams created yet
        </p>
      )}
    </div>
  );
};

const TeamAdder: React.FC<{
  onAdd: (params: { name: string; parentId?: string }) => void;
  teams: Team[];
  isAdding: boolean;
}> = ({ onAdd, teams, isAdding }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ 
      name, 
      parentId: parentId === 'none' ? undefined : parentId 
    });
    setName('');
    setParentId('none');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="teamName">Team Name</Label>
          <Input
            id="teamName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter team name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parentTeam">Parent Team</Label>
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger id="parentTeam">
              <SelectValue placeholder="Select parent team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parent</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Team
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TeamHierarchy;
