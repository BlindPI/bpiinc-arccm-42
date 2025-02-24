
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

interface Team {
  id: string;
  name: string;
  parentId?: string;
  members: string[];
}

interface TeamTree {
  [key: string]: Team & { children: TeamTree };
}

const TeamHierarchy: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamTree, setTeamTree] = useState<TeamTree>({});

  const buildTree = useCallback((items: Team[]): TeamTree => {
    const map: TeamTree = {};
    const tree: TeamTree = {};

    items.forEach(item => {
      map[item.id] = { ...item, children: {} };
    });

    items.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children[item.id] = map[item.id];
      } else {
        tree[item.id] = map[item.id];
      }
    });

    return tree;
  }, []);

  useEffect(() => {
    setTeamTree(buildTree(teams));
  }, [teams, buildTree]);

  const addTeam = (name: string, parentId?: string) => {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name,
      parentId,
      members: []
    };
    setTeams(prev => [...prev, newTeam]);
  };

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
          <TeamAdder onAdd={addTeam} teams={teams} />
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
            {item.members.length} member{item.members.length !== 1 ? 's' : ''}
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
  onAdd: (name: string, parentId?: string) => void;
  teams: Team[];
}> = ({ onAdd, teams }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('none');  // Changed initial value to 'none'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name, parentId === 'none' ? undefined : parentId);  // Handle 'none' value
    setName('');
    setParentId('none');  // Reset to 'none'
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
              <SelectItem value="none">No parent</SelectItem>  {/* Changed from empty string to 'none' */}
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Add Team
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TeamHierarchy;
