import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  Building,
  MapPin,
  Clock
} from 'lucide-react';
import { crmLeadService } from '@/services/crm/crmLeadService';
import { CRMLead, LeadFilters } from '@/types/crm';

interface LeadListViewProps {
  onLeadSelect?: (lead: CRMLead) => void;
  onCreateLead?: () => void;
}

export function LeadListView({ onLeadSelect, onCreateLead }: LeadListViewProps) {
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'company'>('score');

  const queryClient = useQueryClient();
  const limit = 50;

  // Fetch leads with real data integration
  const { data: leadsResponse, isLoading, error } = useQuery({
    queryKey: ['crm', 'leads', filters, page, searchTerm, sortBy],
    queryFn: async () => {
      const searchFilters = { ...filters };
      
      const result = await crmLeadService.getLeads(searchFilters, page, limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30000, // 30 seconds
  });

  // Bulk operations mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ leadIds, assigneeId }: { leadIds: string[], assigneeId: string }) => {
      const results = await Promise.all(
        leadIds.map(id => crmLeadService.assignLead(id, assigneeId))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] });
      setSelectedLeads([]);
    },
  });

  const leads = leadsResponse?.data || [];
  const totalCount = leadsResponse?.total || 0;

  // Filter leads by search term (client-side for immediate feedback)
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    
    const term = searchTerm.toLowerCase();
    return leads.filter(lead => 
      lead.first_name?.toLowerCase().includes(term) ||
      lead.last_name?.toLowerCase().includes(term) ||
      lead.company_name?.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.phone?.includes(term)
    );
  }, [leads, searchTerm]);

  // Lead score color coding
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Lead type badge styling
  const getLeadTypeBadge = (type: string) => {
    const styles = {
      individual: 'bg-blue-100 text-blue-800',
      corporate: 'bg-purple-100 text-purple-800',
      potential_ap: 'bg-green-100 text-green-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Urgency indicator
  const getUrgencyColor = (urgency?: string) => {
    const colors = {
      immediate: 'text-red-600',
      within_month: 'text-orange-600',
      within_quarter: 'text-yellow-600',
      planning: 'text-green-600'
    };
    return colors[urgency as keyof typeof colors] || 'text-gray-600';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleBulkAssign = (assigneeId: string) => {
    if (selectedLeads.length > 0) {
      bulkAssignMutation.mutate({ leadIds: selectedLeads, assigneeId });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading leads: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
          <p className="text-gray-600">
            {totalCount} total leads • {selectedLeads.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateLead} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads by name, company, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select
                value={filters.lead_type || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, lead_type: value as any }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lead Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="potential_ap">Potential AP</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.lead_status || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, lead_status: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.training_urgency || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, training_urgency: value as any }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Urgency</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="within_month">Within Month</SelectItem>
                  <SelectItem value="within_quarter">Within Quarter</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Lead Score</SelectItem>
                  <SelectItem value="date">Date Created</SelectItem>
                  <SelectItem value="company">Company Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedLeads.length} leads selected
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAssign('user-1')}>
                        Assign to Sales Rep 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAssign('user-2')}>
                        Assign to Sales Rep 2
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first lead'
                }
              </p>
              {onCreateLead && (
                <Button onClick={onCreateLead}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onLeadSelect?.(lead)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        {lead.company_name && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {lead.company_name}
                          </div>
                        )}
                        {lead.job_title && (
                          <div className="text-xs text-gray-500">{lead.job_title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getLeadTypeBadge(lead.lead_type)}`}>
                        {lead.lead_type.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getScoreColor(lead.lead_score)}`}>
                          {lead.lead_score}
                        </div>
                        {lead.lead_score >= 70 && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.training_urgency && (
                        <div className={`flex items-center gap-1 ${getUrgencyColor(lead.training_urgency)}`}>
                          <Clock className="h-3 w-3" />
                          <span className="text-sm capitalize">
                            {lead.training_urgency.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-32">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(lead.city || lead.province) && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {lead.city}{lead.city && lead.province && ', '}{lead.province}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                      {lead.next_follow_up_date && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Follow-up due
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onLeadSelect?.(lead)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Convert to Opportunity
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Schedule Follow-up
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} leads
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!leadsResponse?.has_more}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}