
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, 
  Users, 
  Merge, 
  Split, 
  Copy,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface EnterpriseTeamOperationsProps {
  teams: any[];
}

export function EnterpriseTeamOperations({ teams }: EnterpriseTeamOperationsProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState('');

  const bulkOperations = [
    { id: 'update_status', name: 'Update Status', icon: Settings },
    { id: 'assign_location', name: 'Assign Location', icon: Users },
    { id: 'update_performance', name: 'Update Performance Score', icon: RotateCcw },
    { id: 'send_notification', name: 'Send Notification', icon: Zap }
  ];

  const handleBulkOperation = () => {
    if (selectedTeams.length === 0) {
      toast.error('Please select at least one team');
      return;
    }

    toast.success(`${bulkOperation} applied to ${selectedTeams.length} teams`);
    setShowBulkModal(false);
    setSelectedTeams([]);
  };

  const handleMergeTeams = () => {
    if (selectedTeams.length < 2) {
      toast.error('Please select at least 2 teams to merge');
      return;
    }

    toast.success(`Merging ${selectedTeams.length} teams`);
    setShowMergeModal(false);
    setSelectedTeams([]);
  };

  const handleCloneTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    toast.success(`Created clone of ${team?.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enterprise Team Operations
          </h3>
          <p className="text-sm text-muted-foreground">
            Advanced bulk operations and team management tools
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {selectedTeams.length} selected
          </Badge>
          {selectedTeams.length > 0 && (
            <>
              <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Bulk Operations
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Operations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Operation Type</Label>
                      <Select value={bulkOperation} onValueChange={setBulkOperation}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          {bulkOperations.map((op) => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Selected Teams ({selectedTeams.length})</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {teams.filter(t => selectedTeams.includes(t.id)).map(t => t.name).join(', ')}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkOperation} disabled={!bulkOperation}>
                        Apply Operation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedTeams.length >= 2 && (
                <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Teams
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Merge Teams</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Target Team Name</Label>
                        <Input placeholder="Enter name for merged team" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label>Teams to Merge</Label>
                        <div className="mt-1 space-y-2">
                          {teams.filter(t => selectedTeams.includes(t.id)).map((team) => (
                            <div key={team.id} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-4 w-4" />
                              {team.name} ({team.member_count} members)
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Merge Options</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="preserve-roles" />
                            <label htmlFor="preserve-roles" className="text-sm">
                              Preserve member roles
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="combine-performance" />
                            <label htmlFor="combine-performance" className="text-sm">
                              Combine performance scores
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowMergeModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleMergeTeams}>
                          Merge Teams
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {bulkOperations.map((operation) => {
          const IconComponent = operation.icon;
          return (
            <Card key={operation.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-medium">{operation.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Apply to {selectedTeams.length || 'selected'} teams
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Selection</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedTeams(teams.map(t => t.id))}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedTeams([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedTeams.includes(team.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTeams([...selectedTeams, team.id]);
                      } else {
                        setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                      }
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{team.member_count} members</span>
                      <span>{team.location?.name || 'No location'}</span>
                      <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                        {team.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloneTeam(team.id)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Clone
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Split className="h-4 w-4 mr-1" />
                    Split
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-500" />
                <span>Bulk status update applied to 5 teams</span>
              </div>
              <span className="text-muted-foreground">2 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Merge className="h-4 w-4 text-green-500" />
                <span>Teams "Alpha" and "Beta" merged into "Alpha-Beta"</span>
              </div>
              <span className="text-muted-foreground">1 day ago</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-purple-500" />
                <span>Team "Gamma" cloned to "Gamma-Copy"</span>
              </div>
              <span className="text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
