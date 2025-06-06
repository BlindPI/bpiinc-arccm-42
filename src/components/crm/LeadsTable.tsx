
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableOptimized } from '@/components/ui/DataTableOptimized';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, UserPlus, Mail, Phone, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService, Lead } from '@/services/crm/crmService';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { LeadForm } from './LeadForm';
import { LeadConversionModal } from './LeadConversionModal';
import { ConversionResult } from '@/services/crm/leadConversionService';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  lost: 'bg-red-100 text-red-800'
};

export const LeadsTable: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    assigned_to: 'all'
  });

  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => CRMService.getLeads()
  });

  const deleteMutation = useMutation({
    mutationFn: CRMService.deleteLead,
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => {
      toast.error('Failed to delete lead');
    }
  });

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setConversionModalOpen(true);
  };

  const handleConversionSuccess = (result: ConversionResult) => {
    const entitiesCreated = [];
    if (result.contactId) entitiesCreated.push('Contact');
    if (result.accountId) entitiesCreated.push('Account');
    if (result.opportunityId) entitiesCreated.push('Opportunity');
    
    toast.success(`Lead converted successfully! Created: ${entitiesCreated.join(', ')}`);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div>
            <div className="font-medium">
              {lead.first_name} {lead.last_name}
            </div>
            <div className="text-sm text-muted-foreground">{lead.company_name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {lead.email}
            </div>
            {lead.phone && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lead_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('lead_status') as string;
        return (
          <Badge className={statusColors[status as keyof typeof statusColors]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lead_source',
      header: 'Source',
      cell: ({ row }) => {
        const source = row.getValue('lead_source') as string;
        return source.replace('_', ' ').toUpperCase();
      },
    },
    {
      accessorKey: 'lead_score',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.getValue('lead_score') as number;
        return (
          <div className="flex items-center">
            <div className="w-12 text-right font-medium">{score || 0}</div>
            <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min((score || 0), 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => formatDate(row.getValue('created_at')),
    },
    {
      id: 'actions',
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
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedLead(lead);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleConvertLead(lead)}
                disabled={lead.lead_status === 'converted' || lead.lead_status === 'lost'}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert Lead
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(lead.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleLeadSaved = () => {
    setIsFormOpen(false);
    setSelectedLead(null);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search leads..."
          className="max-w-sm"
        />
        <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
          <SelectTrigger className="w-32">
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
        <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="cold_call">Cold Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedLead(null)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            </DialogHeader>
            <LeadForm 
              lead={selectedLead}
              onSave={handleLeadSaved}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTableOptimized
        columns={columns}
        data={leads || []}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No leads found. Start by adding your first lead."
      />

      {/* Lead Conversion Modal */}
      {leadToConvert && (
        <LeadConversionModal
          lead={leadToConvert}
          isOpen={conversionModalOpen}
          onClose={() => {
            setConversionModalOpen(false);
            setLeadToConvert(null);
          }}
          onSuccess={handleConversionSuccess}
        />
      )}
    </div>
  );
};
