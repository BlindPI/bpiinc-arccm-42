import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Award,
  Mail,
  Grid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  MapPin,
  Calendar,
  Package
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { CertificateStatsCards } from './CertificateStatsCards';
import { EnhancedCertificateCard } from './EnhancedCertificateCard';
import { EmailCertificateForm } from '../EmailCertificateForm';
import { BatchEmailAction } from '../BatchEmailAction';
import { toast } from 'sonner';

interface PaginationState {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

interface SortConfig {
  field: keyof Certificate;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  status: string;
  search: string;
  groupBy: 'none' | 'user' | 'location' | 'date' | 'batch';
  sortBy: SortConfig;
}

export function PaginatedCertificatesView() {
  const { data: profile } = useProfile();
  const [filters, setFilters] = useState<FilterConfig>({
    status: 'ACTIVE',
    search: '',
    groupBy: 'none',
    sortBy: { field: 'created_at', direction: 'desc' }
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 0
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [emailDialogCert, setEmailDialogCert] = useState<Certificate | null>(null);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // **STATS QUERY - SEPARATE FROM PAGINATION FOR ACCURATE TOTALS**
  const { data: statsData } = useQuery({
    queryKey: ['certificate-stats', isAdmin, filters.status, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select('id, status, email_status, is_batch_emailed', { count: 'exact' });

      // **CRITICAL SECURITY FIX**: Apply same role-based filtering as paginated query
      if (!isAdmin && profile?.id) {
        if (profile?.role === 'AP') {
          // RLS handles location-based filtering for AP users - SAME AS PAGINATED QUERY
          console.log('AP user stats: Relying on RLS for location-based certificate visibility');
        } else {
          // Other roles: Filter by user_id (existing behavior) - SAME AS PAGINATED QUERY
          query = query.eq('user_id', profile.id);
        }
      }

      // Apply status filter to stats as well
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        certificates: (data || []) as Pick<Certificate, 'id' | 'status' | 'email_status' | 'is_batch_emailed'>[],
        totalCount: count || 0
      };
    },
    enabled: !!profile
  });

  // **SERVER-SIDE PAGINATED QUERY WITH PERFORMANCE OPTIMIZATION**
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['paginated-certificates', isAdmin, filters, pagination.page, pagination.pageSize, profile?.id],
    queryFn: async () => {
      const queryStart = performance.now();
      console.log(`🔍 Paginated Query Starting: Page ${pagination.page}, Size ${pagination.pageSize}`);
      
      // Calculate offset for pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      const limit = pagination.pageSize;
      
      let query = supabase
        .from('certificates')
        .select('*', { count: 'exact' });

      // Apply role-based filtering - CRITICAL: Same as stats query
      if (!isAdmin && profile?.id) {
        if (profile?.role === 'AP') {
          console.log('AP user: Relying on RLS for location-based certificate visibility');
          // RLS policy filters certificates based on AP user's location assignments
        } else {
          // Other roles: Filter by user_id (existing behavior)
          query = query.eq('user_id', profile.id);
        }
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // **SERVER-SIDE SEARCH FILTERING**
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `recipient_name.ilike.${searchTerm},course_name.ilike.${searchTerm},verification_code.ilike.${searchTerm}`
        );
      }

      // **SERVER-SIDE SORTING**
      const sortField = filters.sortBy.field;
      const ascending = filters.sortBy.direction === 'asc';
      query = query.order(sortField, { ascending });

      // **APPLY PAGINATION**
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      
      const queryTime = performance.now() - queryStart;
      console.log(`🔍 Paginated Query Complete: ${data?.length || 0} records fetched in ${queryTime.toFixed(2)}ms`);
      
      if (error) throw error;
      
      return {
        certificates: (data || []) as Certificate[],
        totalCount: count || 0
      };
    },
    enabled: !!profile
  });

  // Update pagination state when data changes
  React.useEffect(() => {
    if (paginatedData) {
      setPagination(prev => ({
        ...prev,
        totalRecords: paginatedData.totalCount,
        totalPages: Math.ceil(paginatedData.totalCount / prev.pageSize)
      }));
    }
  }, [paginatedData]);

  // **GROUPING LOGIC FOR ORGANIZATION**
  const groupedCertificates = useMemo(() => {
    if (!paginatedData?.certificates || filters.groupBy === 'none') {
      return { ungrouped: paginatedData?.certificates || [] };
    }

    const groups: Record<string, Certificate[]> = {};
    
    paginatedData.certificates.forEach(cert => {
      let groupKey = 'Other';
      
      switch (filters.groupBy) {
        case 'user':
          groupKey = cert.recipient_name || 'Unknown User';
          break;
        case 'location':
          groupKey = cert.location_id || 'No Location';
          break;
        case 'date':
          groupKey = cert.created_at?.split('T')[0] || 'Unknown Date';
          break;
        case 'batch':
          groupKey = cert.batch_id || 'No Batch';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(cert);
    });
    
    return groups;
  }, [paginatedData?.certificates, filters.groupBy]);

  // Fetch locations for display
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newPageSize, 
      page: 1,
      totalPages: Math.ceil(prev.totalRecords / newPageSize)
    }));
  };

  const handleSelectCertificate = (certId: string, selected: boolean) => {
    const newSelection = new Set(selectedCertificates);
    if (selected) {
      newSelection.add(certId);
    } else {
      newSelection.delete(certId);
    }
    setSelectedCertificates(newSelection);
  };

  const handleSelectAll = () => {
    const currentPageCerts = Object.values(groupedCertificates).flat();
    if (selectedCertificates.size === currentPageCerts.length) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(new Set(currentPageCerts.map(c => c.id)));
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'REVOKED' })
        .eq('id', certificateId);

      if (error) throw error;
      
      toast.success('Certificate revoked successfully');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    }
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return 'No Location';
    const location = locations.find(loc => loc.id === locationId);
    return location ? `${location.name}, ${location.city}` : 'Unknown Location';
  };

  const renderPaginationControls = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
          {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} of{' '}
          {pagination.totalRecords} certificates
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={pagination.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm">
            {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'recipient_name', label: 'Recipient Name' },
    { value: 'course_name', label: 'Course Name' },
    { value: 'issue_date', label: 'Issue Date' },
    { value: 'expiry_date', label: 'Expiry Date' },
    { value: 'status', label: 'Status' },
  ];

  const groupOptions = [
    { value: 'none', label: 'No Grouping', icon: List },
    { value: 'user', label: 'By User', icon: Users },
    { value: 'location', label: 'By Location', icon: MapPin },
    { value: 'date', label: 'By Date', icon: Calendar },
    { value: 'batch', label: 'By Batch', icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - Use separate stats data for accurate totals */}
      <CertificateStatsCards certificates={statsData?.certificates?.map(cert => ({
        ...cert,
        // Add missing required fields for Certificate type
        certificate_request_id: '',
        issued_by: '',
        verification_code: '',
        certificate_url: '',
        recipient_name: '',
        course_name: '',
        instructor_name: '',
        location_id: '',
        batch_id: '',
        issue_date: '',
        expiry_date: '',
        created_at: '',
        updated_at: '',
        user_id: '',
        template_id: '',
        course_id: '',
        qr_code_url: '',
        certificate_number: '',
        is_template: false,
        recipient_email: '',
        batch_name: '',
        length: 0,
        last_emailed_at: '',
        batch_email_id: '',
        roster_id: ''
      })) as Certificate[] || []} />

      {/* Header and Controls */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Award className="h-6 w-6 text-primary" />
              Certificate Management
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm font-medium">
                {statsData?.totalCount || 0} certificates
              </Badge>
              {selectedCertificates.size > 0 && (
                <Badge variant="secondary" className="text-sm font-medium">
                  {selectedCertificates.size} selected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates by name, course, or verification code..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Status Filters */}
              {['ACTIVE', 'EXPIRED', 'REVOKED', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status === status ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('status', status)}
                  size="sm"
                  className="capitalize"
                >
                  {status === 'all' ? 'All' : status.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Advanced Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Sorting Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <Select
                  value={filters.sortBy.field}
                  onValueChange={(field) => handleFilterChange('sortBy', { ...filters.sortBy, field })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('sortBy', {
                    ...filters.sortBy,
                    direction: filters.sortBy.direction === 'asc' ? 'desc' : 'asc'
                  })}
                  className="px-3"
                >
                  {filters.sortBy.direction === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              
              {/* Grouping Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Group by:</span>
                <Select
                  value={filters.groupBy}
                  onValueChange={(groupBy) => handleFilterChange('groupBy', groupBy)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Display */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          ) : !paginatedData?.certificates?.length ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-600">No certificates match your current search criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render grouped or ungrouped certificates */}
              {Object.entries(groupedCertificates).map(([groupKey, certificates]) => (
                <div key={groupKey}>
                  {filters.groupBy !== 'none' && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {groupKey} ({certificates.length})
                      </h3>
                      <hr className="border-gray-200" />
                    </div>
                  )}
                  
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {certificates.map((certificate) => (
                      <EnhancedCertificateCard
                        key={certificate.id}
                        certificate={certificate}
                        isSelected={selectedCertificates.has(certificate.id)}
                        onSelect={(selected) => handleSelectCertificate(certificate.id, selected)}
                        onEmail={() => setEmailDialogCert(certificate)}
                        onRevoke={() => handleRevokeCertificate(certificate.id)}
                        locationName={getLocationName(certificate.location_id)}
                        showActions={isAdmin}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              <div className="mt-6 pt-6 border-t">
                {renderPaginationControls()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      {emailDialogCert && (
        <Dialog open={!!emailDialogCert} onOpenChange={() => setEmailDialogCert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Certificate</DialogTitle>
            </DialogHeader>
            <EmailCertificateForm
              certificate={emailDialogCert}
              onClose={() => setEmailDialogCert(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}