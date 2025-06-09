
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { Lead } from '@/types/crm';
import { RealCRMService } from '@/services/crm/realCRMService';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  Star, 
  Target, 
  User,
  Phone,
  Mail,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EnhancedLeadsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => RealCRMService.getLeads()
  });

  const { mutate: updateLeadScore } = useMutation({
    mutationFn: (leadId: string) => RealCRMService.calculateLeadScore(leadId),
    onSuccess: () => {
      toast.success('Lead score updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const { mutate: assignLead } = useMutation({
    mutationFn: (leadId: string) => RealCRMService.assignLeadIntelligently(leadId),
    onSuccess: () => {
      toast.success('Lead assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const { mutate: qualifyLead } = useMutation({
    mutationFn: (leadId: string) => RealCRMService.qualifyLeadAutomatically(leadId),
    onSuccess: () => {
      toast.success('Lead qualification updated');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const { mutate: updateLeadStatus } = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      RealCRMService.updateLead(leadId, { lead_status: status as any }),
    onSuccess: () => {
      toast.success('Lead status updated');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const { mutate: logActivity } = useMutation({
    mutationFn: (activity: any) => RealCRMService.createLeadActivity(activity),
    onSuccess: () => {
      toast.success('Activity logged');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const { mutate: updateUrgency } = useMutation({
    mutationFn: ({ leadId, urgency }: { leadId: string; urgency: string }) =>
      RealCRMService.updateLead(leadId, { training_urgency: urgency as any }),
    onSuccess: () => {
      toast.success('Training urgency updated');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    if (score >= 40) return 'text-orange-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case 'immediate': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'within_month': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'within_quarter': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "lead_score",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("lead_score") as number;
        return (
          <div className="flex items-center gap-2">
            <span className={getScoreColor(score)}>{score}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateLeadScore(row.original.id)}
              className="h-6 w-6 p-0"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "first_name",
      header: "Name",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {lead.first_name} {lead.last_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {lead.company_name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {lead.email}
            </div>
            {lead.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "lead_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("lead_status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lead_source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.getValue("lead_source") as string;
        return (
          <Badge variant="outline">
            {source?.replace('_', ' ').toUpperCase() || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "training_urgency",
      header: "Urgency",
      cell: ({ row }) => {
        const urgency = row.original.training_urgency;
        return (
          <div className="flex items-center gap-2">
            {getUrgencyIcon(urgency)}
            <span className="text-sm capitalize">
              {urgency?.replace('_', ' ') || 'Not specified'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedTo = row.original.assigned_to;
        return assignedTo ? (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="text-sm">Assigned</span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => assignLead(row.original.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Target className="h-3 w-3 mr-1" />
            Assign
          </Button>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => updateLeadScore(lead.id)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Score
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => qualifyLead(lead.id)}>
                <Star className="h-4 w-4 mr-2" />
                Auto Qualify
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => assignLead(lead.id)}>
                <Target className="h-4 w-4 mr-2" />
                Smart Assign
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => updateLeadStatus({ leadId: lead.id, status: 'contacted' })}
              >
                Mark as Contacted
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => updateLeadStatus({ leadId: lead.id, status: 'qualified' })}
              >
                Mark as Qualified
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => logActivity({
                  lead_id: lead.id,
                  activity_type: 'call',
                  activity_details: { type: 'outbound_call', duration: 300 },
                  engagement_score: 10
                })}
              >
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => logActivity({
                  lead_id: lead.id,
                  activity_type: 'email',
                  activity_details: { type: 'follow_up_email' },
                  engagement_score: 5
                })}
              >
                <Mail className="h-4 w-4 mr-2" />
                Log Email
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => updateUrgency({ leadId: lead.id, urgency: 'immediate' })}
              >
                Set High Urgency
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.lead_source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Enhanced Lead Management
          <Button onClick={() => refetch()} size="sm" variant="outline">
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredLeads}
          />
        </div>
      </CardContent>
    </Card>
  );
}
