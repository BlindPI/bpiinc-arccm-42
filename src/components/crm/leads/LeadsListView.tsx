
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { LeadDetailModal } from './LeadDetailModal';
import { CreateLeadModal } from './CreateLeadModal';

export function LeadsListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => CRMService.getLeads()
  });

  const filteredLeads = leads.filter(lead =>
    lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setShowCreateModal(true);
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
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Leads List */}
        <div className="space-y-2">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No leads found</p>
              <p className="text-sm">Create your first lead to get started</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </h3>
                      <Badge className={getStatusColor(lead.lead_status)}>
                        {lead.lead_status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Score: {lead.lead_score}/100</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {lead.company_name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.company_name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Source: {lead.lead_source}</span>
                      <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateLeadModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        lead={selectedLead}
        onSuccess={() => {
          setShowCreateModal(false);
          setSelectedLead(null);
        }}
      />

      <LeadDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        lead={selectedLead}
      />
    </>
  );
}
