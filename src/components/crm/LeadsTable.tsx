
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { LeadFormDialog } from '@/components/crm/forms/LeadFormDialog';
import { LeadConversionDialog } from '@/components/crm/forms/LeadConversionDialog';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

export function LeadsTable() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => CRMService.getLeads()
  });

  const deleteMutation = useMutation({
    mutationFn: (leadId: string) => CRMService.deleteLead(leadId),
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: (error) => {
      toast.error('Failed to delete lead: ' + error.message);
    }
  });

  const handleCreateLead = () => {
    setSelectedLead(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDeleteLead = (lead: Lead) => {
    if (confirm(`Are you sure you want to delete the lead for ${lead.first_name} ${lead.last_name}?`)) {
      deleteMutation.mutate(lead.id);
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setConversionDialogOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Leads refreshed');
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Company', 'Status', 'Source', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.first_name} ${lead.last_name}"`,
        lead.email,
        `"${lead.company_name || ''}"`,
        lead.lead_status,
        lead.lead_source,
        new Date(lead.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Leads exported successfully');
  };

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

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'website': return 'bg-blue-50 text-blue-700';
      case 'referral': return 'bg-green-50 text-green-700';
      case 'social_media': return 'bg-purple-50 text-purple-700';
      case 'email': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const canConvert = (lead: Lead) => {
    return lead.lead_status !== 'converted' && lead.lead_status !== 'lost';
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
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Track and manage potential customers through the sales funnel
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCreateLead}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No leads found. Create your first lead to get started.</p>
                <Button onClick={handleCreateLead} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{lead.first_name} {lead.last_name}</h3>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                        {lead.company_name && (
                          <p className="text-sm text-gray-400">{lead.company_name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {lead.lead_score}/100</div>
                        {lead.training_urgency && (
                          <div className="text-xs text-gray-500 capitalize">
                            {lead.training_urgency.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      
                      <Badge className={getStatusColor(lead.lead_status)}>
                        {lead.lead_status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getSourceColor(lead.lead_source)}>
                        {lead.lead_source.replace('_', ' ')}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canConvert(lead) && (
                            <DropdownMenuItem onClick={() => handleConvertLead(lead)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Convert Lead
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Change Stage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLead(lead)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        }}
      />

      <LeadConversionDialog
        open={conversionDialogOpen}
        onOpenChange={setConversionDialogOpen}
        lead={leadToConvert}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
          queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
          queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
        }}
      />
    </>
  );
}
