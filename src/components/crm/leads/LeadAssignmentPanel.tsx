import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  Target, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3,
  Shuffle
} from 'lucide-react';
import { crmLeadService } from '@/services/crm/crmLeadService';
import { CRMLead } from '@/types/crm';

interface SalesRep {
  id: string;
  name: string;
  email: string;
  territory: string[];
  current_workload: number;
  max_capacity: number;
  performance_score: number;
  specializations: string[];
}

interface AssignmentRule {
  id: string;
  name: string;
  type: 'territory' | 'workload' | 'round_robin' | 'skill_based';
  criteria: Record<string, any>;
  priority: number;
  is_active: boolean;
}

interface LeadAssignmentPanelProps {
  selectedLeads: CRMLead[];
  onAssignmentComplete?: () => void;
  onClose?: () => void;
}

export function LeadAssignmentPanel({ selectedLeads, onAssignmentComplete, onClose }: LeadAssignmentPanelProps) {
  const [assignmentMethod, setAssignmentMethod] = useState<'manual' | 'automatic' | 'rules'>('automatic');
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [showRulesConfig, setShowRulesConfig] = useState(false);

  const queryClient = useQueryClient();

  // Mock data for sales reps (in real implementation, this would come from user management)
  const salesReps: SalesRep[] = [
    {
      id: 'rep-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      territory: ['ON', 'QC'],
      current_workload: 15,
      max_capacity: 25,
      performance_score: 92,
      specializations: ['corporate', 'healthcare']
    },
    {
      id: 'rep-2',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      territory: ['BC', 'AB'],
      current_workload: 8,
      max_capacity: 20,
      performance_score: 88,
      specializations: ['individual', 'construction']
    },
    {
      id: 'rep-3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      territory: ['MB', 'SK'],
      current_workload: 12,
      max_capacity: 22,
      performance_score: 95,
      specializations: ['potential_ap', 'government']
    }
  ];

  // Mock assignment rules
  const assignmentRules: AssignmentRule[] = [
    {
      id: 'rule-1',
      name: 'Territory-Based Assignment',
      type: 'territory',
      criteria: { match_province: true },
      priority: 1,
      is_active: true
    },
    {
      id: 'rule-2',
      name: 'Workload Balancing',
      type: 'workload',
      criteria: { max_workload_difference: 5 },
      priority: 2,
      is_active: true
    },
    {
      id: 'rule-3',
      name: 'Skill-Based Assignment',
      type: 'skill_based',
      criteria: { match_specialization: true },
      priority: 3,
      is_active: true
    }
  ];

  // Real assignment logic
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ leadIds, assigneeId, rules }: { 
      leadIds: string[], 
      assigneeId?: string, 
      rules?: string[] 
    }) => {
      const results = await Promise.all(
        leadIds.map(id => crmLeadService.assignLead(id, assigneeId || ''))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] });
      onAssignmentComplete?.();
    },
  });

  const autoAssignLeads = () => {
    const assignments = selectedLeads.map(lead => {
      // Territory-based assignment
      const territoryMatch = salesReps.find(rep => 
        rep.territory.includes(lead.province || '')
      );
      
      if (territoryMatch) {
        return { leadId: lead.id, assigneeId: territoryMatch.id };
      }
      
      // Workload-based assignment (find rep with lowest workload)
      const availableRep = salesReps
        .filter(rep => rep.current_workload < rep.max_capacity)
        .sort((a, b) => a.current_workload - b.current_workload)[0];
      
      return { 
        leadId: lead.id, 
        assigneeId: availableRep?.id || salesReps[0].id 
      };
    });

    // Execute assignments
    assignments.forEach(assignment => {
      bulkAssignMutation.mutate({ 
        leadIds: [assignment.leadId], 
        assigneeId: assignment.assigneeId 
      });
    });
  };

  const manualAssignLeads = () => {
    if (!selectedRep) return;
    
    bulkAssignMutation.mutate({ 
      leadIds: selectedLeads.map(lead => lead.id), 
      assigneeId: selectedRep 
    });
  };

  const getRecommendedAssignment = (lead: CRMLead): SalesRep | null => {
    // Territory match
    const territoryMatch = salesReps.find(rep => 
      rep.territory.includes(lead.province || '')
    );
    
    if (territoryMatch && territoryMatch.current_workload < territoryMatch.max_capacity) {
      return territoryMatch;
    }
    
    // Skill match
    const skillMatch = salesReps.find(rep => 
      rep.specializations.includes(lead.lead_type) &&
      rep.current_workload < rep.max_capacity
    );
    
    if (skillMatch) {
      return skillMatch;
    }
    
    // Workload balance
    return salesReps
      .filter(rep => rep.current_workload < rep.max_capacity)
      .sort((a, b) => a.current_workload - b.current_workload)[0] || null;
  };

  const getWorkloadPercentage = (rep: SalesRep): number => {
    return (rep.current_workload / rep.max_capacity) * 100;
  };

  const getWorkloadColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lead Assignment</h3>
          <p className="text-gray-600">
            Assign {selectedLeads.length} selected leads to sales representatives
          </p>
        </div>
        <Dialog open={showRulesConfig} onOpenChange={setShowRulesConfig}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Rules
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assignment Rules Configuration</DialogTitle>
              <DialogDescription>
                Configure automatic assignment rules and their priority order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {assignmentRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={rule.is_active} />
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-gray-600">Priority: {rule.priority}</div>
                    </div>
                  </div>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment Method</CardTitle>
          <CardDescription>
            Choose how you want to assign the selected leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                assignmentMethod === 'automatic' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setAssignmentMethod('automatic')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shuffle className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Automatic</span>
              </div>
              <p className="text-sm text-gray-600">
                Assign based on territory, workload, and skills
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                assignmentMethod === 'manual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setAssignmentMethod('manual')}
            >
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium">Manual</span>
              </div>
              <p className="text-sm text-gray-600">
                Assign all leads to a specific sales rep
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                assignmentMethod === 'rules' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setAssignmentMethod('rules')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Rule-Based</span>
              </div>
              <p className="text-sm text-gray-600">
                Apply custom assignment rules
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Assignment */}
      {assignmentMethod === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Sales Representative</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRep} onValueChange={setSelectedRep}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sales representative" />
              </SelectTrigger>
              <SelectContent>
                {salesReps.map(rep => (
                  <SelectItem key={rep.id} value={rep.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{rep.name}</span>
                      <Badge className={`ml-2 ${getWorkloadColor(getWorkloadPercentage(rep))}`}>
                        {rep.current_workload}/{rep.max_capacity}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Rule-Based Assignment */}
      {assignmentMethod === 'rules' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger>
                <SelectValue placeholder="Choose assignment rule" />
              </SelectTrigger>
              <SelectContent>
                {assignmentRules
                  .filter(rule => rule.is_active)
                  .map(rule => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Sales Rep Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sales Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesReps.map(rep => (
              <div key={rep.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{rep.name}</div>
                    <div className="text-sm text-gray-600">{rep.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {rep.territory.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">Workload</div>
                    <Badge className={getWorkloadColor(getWorkloadPercentage(rep))}>
                      {rep.current_workload}/{rep.max_capacity}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">Performance</div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium">{rep.performance_score}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">Specializations</div>
                    <div className="flex gap-1 mt-1">
                      {rep.specializations.slice(0, 2).map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Preview */}
      {assignmentMethod === 'automatic' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment Preview</CardTitle>
            <CardDescription>
              Preview of automatic assignments based on territory and workload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Recommended Assignment</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLeads.map(lead => {
                  const recommended = getRecommendedAssignment(lead);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </div>
                          {lead.company_name && (
                            <div className="text-sm text-gray-600">{lead.company_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lead.lead_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.city}, {lead.province}
                      </TableCell>
                      <TableCell>
                        {recommended ? (
                          <div>
                            <div className="font-medium">{recommended.name}</div>
                            <div className="text-sm text-gray-600">
                              Workload: {recommended.current_workload}/{recommended.max_capacity}
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-600">No available rep</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {recommended?.territory.includes(lead.province || '') && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Territory match
                            </div>
                          )}
                          {recommended?.specializations.includes(lead.lead_type) && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Target className="h-3 w-3" />
                              Skill match
                            </div>
                          )}
                          {!recommended?.territory.includes(lead.province || '') && 
                           !recommended?.specializations.includes(lead.lead_type) && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="h-3 w-3" />
                              Workload balance
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        
        <Button
          onClick={
            assignmentMethod === 'automatic' 
              ? autoAssignLeads 
              : assignmentMethod === 'manual'
                ? manualAssignLeads
                : autoAssignLeads
          }
          disabled={
            bulkAssignMutation.isPending ||
            (assignmentMethod === 'manual' && !selectedRep) ||
            (assignmentMethod === 'rules' && !selectedRule)
          }
          className="flex items-center gap-2"
        >
          {bulkAssignMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Assigning...
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              Assign Leads ({selectedLeads.length})
            </>
          )}
        </Button>
      </div>

      {bulkAssignMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Assignment Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {bulkAssignMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
}