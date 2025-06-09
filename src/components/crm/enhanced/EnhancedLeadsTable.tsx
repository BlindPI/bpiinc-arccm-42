
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Target,
  Zap,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RealCRMService } from '@/services/crm/realCRMService';
import { LeadFormDialog } from '@/components/crm/forms/LeadFormDialog';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

export function EnhancedLeadsTable() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['enhanced-crm-leads'],
    queryFn: () => RealCRMService.getLeads()
  });

  const { data: scoringRules = [] } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: () => RealCRMService.getLeadScoringRules()
  });

  const { data: assignmentPerformance = [] } = useQuery({
    queryKey: ['assignment-performance'],
    queryFn: () => RealCRMService.getAssignmentPerformance()
  });

  const scoreLeadMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.calculateLeadScore(leadId),
    onSuccess: (score, leadId) => {
      toast.success(`Lead scored: ${score} points`);
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
    }
  });

  const assignLeadMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.assignLeadIntelligently(leadId),
    onSuccess: (assignedTo, leadId) => {
      if (assignedTo) {
        toast.success('Lead assigned intelligently');
        queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
      } else {
        toast.warning('No suitable assignee found');
      }
    }
  });

  const qualifyLeadMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.qualifyLeadAutomatically(leadId),
    onSuccess: (qualified, leadId) => {
      if (qualified) {
        toast.success('Lead automatically qualified');
        queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
      } else {
        toast.info('Lead does not meet qualification criteria');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.deleteLead(leadId),
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
    }
  });

  const handleScoreLead = (lead: Lead) => {
    scoreLeadMutation.mutate(lead.id);
  };

  const handleAssignLead = (lead: Lead) => {
    assignLeadMutation.mutate(lead.id);
  };

  const handleQualifyLead = (lead: Lead) => {
    qualifyLeadMutation.mutate(lead.id);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'within_month': return 'bg-orange-100 text-orange-800';
      case 'within_quarter': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Enhanced Lead Management
              </CardTitle>
              <CardDescription>
                AI-powered lead scoring, intelligent assignment, and automated qualification
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{leads.length}</div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.lead_score >= 70).length}
              </div>
              <div className="text-sm text-gray-600">High Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {leads.filter(l => l.training_urgency === 'immediate').length}
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {leads.filter(l => l.lead_status === 'qualified').length}
              </div>
              <div className="text-sm text-gray-600">Qualified</div>
            </div>
          </div>

          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No leads found. Create your first lead to get started.</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{lead.first_name} {lead.last_name}</h3>
                            <Badge className={getScoreColor(lead.lead_score)}>
                              Score: {lead.lead_score}
                            </Badge>
                            {lead.training_urgency && (
                              <Badge className={getUrgencyColor(lead.training_urgency)}>
                                {lead.training_urgency.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <div className="font-medium">{lead.email}</div>
                              {lead.company_name && <div>{lead.company_name}</div>}
                            </div>
                            
                            <div>
                              <div>Source: {lead.lead_source.replace('_', ' ')}</div>
                              <div>Status: {lead.lead_status}</div>
                            </div>
                            
                            <div>
                              {lead.estimated_participant_count && (
                                <div>Participants: {lead.estimated_participant_count}</div>
                              )}
                              {lead.budget_range && (
                                <div>Budget: {lead.budget_range}</div>
                              )}
                            </div>
                          </div>

                          {/* Score Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">Lead Score</span>
                              <span className="text-xs font-medium">{lead.lead_score}/100</span>
                            </div>
                            <Progress value={lead.lead_score} className="h-2" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Quick Actions */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScoreLead(lead)}
                          disabled={scoreLeadMutation.isPending}
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignLead(lead)}
                          disabled={assignLeadMutation.isPending}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQualifyLead(lead)}
                          disabled={qualifyLeadMutation.isPending}
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setDialogMode('view');
                              setDialogOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setDialogMode('edit');
                              setDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(lead.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLead={selectedLead}
        mode={dialogMode}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
        }}
      />
    </>
  );
}
