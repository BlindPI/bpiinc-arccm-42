
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { CRMLeadService } from '@/services/crm/crmLeadService';
import { LeadForm } from './LeadForm';
import { toast } from 'sonner';

interface LeadsTableProps {
  onLeadSelect?: (leadId: string) => void;
}

export function LeadsTable({ onLeadSelect }: LeadsTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => CRMLeadService.getLeads()
  });

  const { mutate: deleteLead } = useMutation({
    mutationFn: CRMLeadService.deleteLead,
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    }
  });

  const filteredLeads = leads.filter(lead =>
    lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    setShowAddForm(false);
    setEditingLead(null);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'company_name',
      header: 'Company',
      cell: ({ row }: any) => row.original.company_name || 'N/A',
    },
    {
      accessorKey: 'lead_status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.lead_status;
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          new: 'secondary',
          contacted: 'outline',
          qualified: 'default',
          converted: 'default',
          lost: 'destructive'
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'lead_score',
      header: 'Score',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.lead_score}/100</div>
      ),
    },
    {
      accessorKey: 'lead_source',
      header: 'Source',
      cell: ({ row }: any) => row.original.lead_source,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {onLeadSelect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLeadSelect(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingLead(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteLead(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredLeads}
      />

      {(showAddForm || editingLead) && (
        <LeadForm
          lead={editingLead}
          onSave={handleFormSuccess}
          onCancel={() => {
            setShowAddForm(false);
            setEditingLead(null);
          }}
        />
      )}
    </div>
  );
}
