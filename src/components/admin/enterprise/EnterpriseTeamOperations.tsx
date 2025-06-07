
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Users, 
  Archive, 
  RefreshCw, 
  Shield, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Download
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { toast } from 'sonner';

interface EnterpriseTeamOperationsProps {
  teams: any[];
}

export function EnterpriseTeamOperations({ teams }: EnterpriseTeamOperationsProps) {
  const queryClient = useQueryClient();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState('');
  const [operationReason, setOperationReason] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, teamIds, reason }: { 
      operation: string; 
      teamIds: string[]; 
      reason: string; 
    }) => {
      // Mock bulk operations
      const results = teamIds.map(id => ({
        teamId: id,
        success: Math.random() > 0.1, // 90% success rate
        error: Math.random() > 0.9 ? 'Operation failed' : null
      }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        operation,
        processed: teamIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    },
    onSuccess: (result) => {
      toast.success(
        `Bulk ${result.operation} completed: ${result.successful}/${result.processed} successful`
      );
      setSelectedTeams([]);
      setShowBulkDialog(false);
      queryClient.invalidateQueries({ queryKey: ['enterprise-teams'] });
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });

  const automationMutation = useMutation({
    mutationFn: async (rule: any) => {
      // Mock automation rule creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Math.random().toString(), ...rule };
    },
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
    onError: (error) => {
      toast.error(`Failed to create automation rule: ${error.message}`);
    }
  });

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    }
  };

  const handleBulkOperation = () => {
    if (!bulkOperation || selectedTeams.length === 0) {
      toast.error('Please select teams and operation');
      return;
    }

    bulkOperationMutation.mutate({
      operation: bulkOperation,
      teamIds: selectedTeams,
      reason: operationReason
    });
  };

  const getTeamStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Operations Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Enterprise Team Operations</h2>
          <p className="text-muted-foreground">Bulk operations and automated team management</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Operations Log
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Team Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk Controls */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTeams.length === teams.length && teams.length > 0}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    setSelectedTeams(teams.map(t => t.id));
                  } else {
                    setSelectedTeams([]);
                  }
                }}
              />
              <span className="text-sm">Select All ({selectedTeams.length} selected)</span>
            </div>
            
            <Select value={bulkOperation} onValueChange={setBulkOperation}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select operation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">Activate Teams</SelectItem>
                <SelectItem value="deactivate">Deactivate Teams</SelectItem>
                <SelectItem value="archive">Archive Teams</SelectItem>
                <SelectItem value="update_settings">Update Settings</SelectItem>
                <SelectItem value="assign_location">Assign Location</SelectItem>
                <SelectItem value="performance_review">Performance Review</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button 
                  disabled={selectedTeams.length === 0 || !bulkOperation}
                  variant="default"
                >
                  Execute Operation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Bulk Operation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      You are about to perform <strong>{bulkOperation}</strong> on {selectedTeams.length} teams.
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Reason (Optional)</label>
                    <Textarea
                      value={operationReason}
                      onChange={(e) => setOperationReason(e.target.value)}
                      placeholder="Provide a reason for this bulk operation..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkOperation}
                      disabled={bulkOperationMutation.isPending}
                    >
                      {bulkOperationMutation.isPending ? 'Processing...' : 'Confirm Operation'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBulkDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Team Selection List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedTeams.includes(team.id)}
                    onCheckedChange={(checked) => handleTeamSelection(team.id, checked === true)}
                  />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      {getTeamStatusIcon(team.status)}
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="outline">
                        {team.team_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {team.location?.name || 'No location'} • {team.members?.length || 0} members
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {team.performance_score || 0}% performance
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Team Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Automation Rule Examples */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Auto-Archive Inactive Teams</h4>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Automatically archive teams with no activity for 90+ days
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Disable</Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Performance Monitoring</h4>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Alert when team performance drops below 70%
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Disable</Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Member Capacity Alerts</h4>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Notify when team size exceeds capacity limits
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Enable</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Compliance Monitoring</h4>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Auto-flag teams with compliance issues
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Logs</Button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => automationMutation.mutate({
                  name: 'New Automation Rule',
                  type: 'team_monitoring',
                  enabled: true
                })}
                disabled={automationMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-2" />
                Create New Automation Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent operations */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Bulk Team Activation</div>
                <div className="text-sm text-muted-foreground">
                  Activated 5 teams • 2 hours ago
                </div>
              </div>
              <Badge variant="default">Success</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Performance Review Batch</div>
                <div className="text-sm text-muted-foreground">
                  Reviewed 12 teams • 1 day ago
                </div>
              </div>
              <Badge variant="default">Success</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Location Assignment</div>
                <div className="text-sm text-muted-foreground">
                  Assigned 8 teams to new locations • 2 days ago
                </div>
              </div>
              <Badge variant="secondary">Partial</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
