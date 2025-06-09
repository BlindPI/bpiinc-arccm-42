
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  User, 
  Target, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Send,
  Phone,
  Mail,
  Calendar,
  Star
} from 'lucide-react';
import { RealCRMService } from '@/services/crm/realCRMService';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';
import type { ColumnDef } from '@tanstack/react-table';

export function EnhancedLeadsTable() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionData, setActionData] = useState<any>({});

  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['enhanced-crm-leads'],
    queryFn: () => RealCRMService.getLeads()
  });

  // Real backend mutations
  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: Partial<Lead> }) =>
      RealCRMService.updateLead(leadId, data),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
      setActionDialogOpen(false);
    }
  });

  const calculateScoreMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.calculateLeadScore(leadId),
    onSuccess: (score, leadId) => {
      toast.success(`Lead score calculated: ${score}`);
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
    }
  });

  const assignLeadMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.assignLeadIntelligently(leadId),
    onSuccess: (assignedUserId, leadId) => {
      if (assignedUserId) {
        toast.success('Lead assigned intelligently');
      } else {
        toast.warning('No suitable assignee found');
      }
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
    }
  });

  const qualifyLeadMutation = useMutation({
    mutationFn: (leadId: string) => RealCRMService.qualifyLeadAutomatically(leadId),
    onSuccess: (qualified, leadId) => {
      if (qualified) {
        toast.success('Lead automatically qualified');
      } else {
        toast.warning('Lead does not meet qualification criteria');
      }
      queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
    }
  });

  const handleLeadAction = (lead: Lead, action: string) => {
    setSelectedLead(lead);
    setActionType(action);
    setActionData({});

    switch (action) {
      case 'calculate_score':
        calculateScoreMutation.mutate(lead.id);
        break;
      case 'assign_intelligent':
        assignLeadMutation.mutate(lead.id);
        break;
      case 'qualify_auto':
        qualifyLeadMutation.mutate(lead.id);
        break;
      case 'change_status':
      case 'add_activity':
      case 'update_urgency':
        setActionDialogOpen(true);
        break;
    }
  };

  const handleStatusChange = () => {
    if (selectedLead && actionData.status) {
      updateLeadMutation.mutate({
        leadId: selectedLead.id,
        data: { lead_status: actionData.status }
      });
    }
  };

  const handleUrgencyUpdate = () => {
    if (selectedLead && actionData.urgency) {
      updateLeadMutation.mutate({
        leadId: selectedLead.id,
        data: { training_urgency: actionData.urgency }
      });
    }
  };

  const handleActivityAdd = () => {
    if (selectedLead && actionData.activityType && actionData.subject) {
      // Create activity through CRM service
      RealCRMService.createLeadActivity({
        lead_id: selectedLead.id,
        activity_type: actionData.activityType,
        activity_details: {
          subject: actionData.subject,
          description: actionData.description,
          outcome: actionData.outcome
        },
        engagement_score: actionData.activityType === 'call' ? 10 : 
                         actionData.activityType === 'email' ? 5 : 8
      }).then(() => {
        toast.success('Activity added successfully');
        queryClient.invalidateQueries({ queryKey: ['enhanced-crm-leads'] });
        setActionDialogOpen(false);
      }).catch(() => {
        toast.error('Failed to add activity');
      });
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'converted': return 'default';
      case 'qualified': return 'secondary';
      case 'contacted': return 'outline';
      case 'new': return 'destructive';
      default: return 'outline';
    }
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "first_name",
      header: "Name",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center space-x-2">
            <div>
              <div className="font-medium">{lead.first_name} {lead.last_name}</div>
              <div className="text-sm text-gray-500">{lead.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "company_name",
      header: "Company",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div>
            <div className="font-medium">{lead.company_name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{lead.job_title || ''}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "lead_score",
      header: "Score",
      cell: ({ row }) => {
        const score = row.original.lead_score;
        return (
          <div className="flex items-center space-x-2">
            <Badge className={getScoreBadgeColor(score)}>
              {score}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLeadAction(row.original, 'calculate_score')}
              disabled={calculateScoreMutation.isPending}
            >
              <Star className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "lead_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.lead_status;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lead_source",
      header: "Source",
      cell: ({ row }) => {
        return (
          <span className="capitalize">
            {row.original.lead_source?.replace('_', ' ') || 'Unknown'}
          </span>
        );
      },
    },
    {
      accessorKey: "training_urgency",
      header: "Urgency",
      cell: ({ row }) => {
        const urgency = row.original.training_urgency;
        const urgencyColors = {
          immediate: 'bg-red-100 text-red-800',
          within_month: 'bg-orange-100 text-orange-800',
          within_quarter: 'bg-yellow-100 text-yellow-800',
          planning: 'bg-blue-100 text-blue-800'
        };
        return urgency ? (
          <Badge className={urgencyColors[urgency as keyof typeof urgencyColors]}>
            {urgency.replace('_', ' ')}
          </Badge>
        ) : null;
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedTo = row.original.assigned_to;
        return (
          <div className="flex items-center space-x-2">
            {assignedTo ? (
              <Badge variant="outline">Assigned</Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLeadAction(row.original, 'assign_intelligent')}
                disabled={assignLeadMutation.isPending}
              >
                <User className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-gray-500">
            {formatDate(row.original.created_at)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLeadAction(lead, 'change_status')}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLeadAction(lead, 'qualify_auto')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Auto Qualify
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLeadAction(lead, 'add_activity')}>
                <Calendar className="h-4 w-4 mr-2" />
                Add Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLeadAction(lead, 'update_urgency')}>
                <Clock className="h-4 w-4 mr-2" />
                Update Urgency
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading enhanced leads...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced Lead Management
          </CardTitle>
          <CardDescription>
            Advanced lead management with real-time scoring, intelligent assignment, and automated workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={leads}
            searchKey="first_name"
            searchPlaceholder="Search leads..."
          />
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'change_status' && 'Change Lead Status'}
              {actionType === 'add_activity' && 'Add Activity'}
              {actionType === 'update_urgency' && 'Update Training Urgency'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'change_status' && (
              <>
                <div>
                  <Label>New Status</Label>
                  <Select value={actionData.status} onValueChange={(value) => setActionData({...actionData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStatusChange} disabled={updateLeadMutation.isPending}>
                  Update Status
                </Button>
              </>
            )}

            {actionType === 'update_urgency' && (
              <>
                <div>
                  <Label>Training Urgency</Label>
                  <Select value={actionData.urgency} onValueChange={(value) => setActionData({...actionData, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="within_month">Within Month</SelectItem>
                      <SelectItem value="within_quarter">Within Quarter</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUrgencyUpdate} disabled={updateLeadMutation.isPending}>
                  Update Urgency
                </Button>
              </>
            )}

            {actionType === 'add_activity' && (
              <>
                <div>
                  <Label>Activity Type</Label>
                  <Select value={actionData.activityType} onValueChange={(value) => setActionData({...actionData, activityType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input 
                    value={actionData.subject} 
                    onChange={(e) => setActionData({...actionData, subject: e.target.value})}
                    placeholder="Activity subject"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={actionData.description} 
                    onChange={(e) => setActionData({...actionData, description: e.target.value})}
                    placeholder="Activity details"
                  />
                </div>
                <div>
                  <Label>Outcome</Label>
                  <Input 
                    value={actionData.outcome} 
                    onChange={(e) => setActionData({...actionData, outcome: e.target.value})}
                    placeholder="Activity outcome"
                  />
                </div>
                <Button onClick={handleActivityAdd}>
                  Add Activity
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
