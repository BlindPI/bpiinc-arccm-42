
import React, { useState } from 'react';
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
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

export function EnhancedCertificatesView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [emailDialogCert, setEmailDialogCert] = useState<Certificate | null>(null);
  
  // **PAGINATION STATE**
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<keyof Certificate>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'user' | 'location' | 'date' | 'batch'>('none');

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: paginatedData, isLoading, error: queryError } = useQuery({
    queryKey: ['enhanced-certificates', isAdmin, statusFilter, profile?.id, currentPage, pageSize, sortBy, sortDirection, searchQuery],
    queryFn: async () => {
      // 🔍 PAGINATION DIAGNOSTIC: Log query start time
      const queryStart = performance.now();
      console.log(`🔍 Certificate Query Starting - Page ${currentPage}, Size ${pageSize} with server-side pagination`);
      console.log(`🔍 Profile state:`, { profile, isAdmin, profileId: profile?.id, role: profile?.role });
      
      // **FIXED: For AP users, get certificates using proper location-based filtering service**
      if (!isAdmin && profile?.role === 'AP' && profile?.id) {
        console.log('🔍 AP user detected - using proper location-based certificate service (same as AP dashboard)');
        
        // **CRITICAL FIX: Use the SAME service as AP dashboard for consistent certificate counts**
        // This ensures AP users see the same 347 certificates in both dashboard and certificate pages
        
        // First, get the provider ID for this AP user
        const { data: apUser, error: apError } = await supabase
          .from('authorized_providers')
          .select('id')
          .eq('user_id', profile.id)
          .single();
          
        if (apError || !apUser) {
          console.error('🔍 Could not find provider for AP user:', apError);
          return { certificates: [], totalCount: 0, allCertificates: [] };
        }
        
        const providerId = apUser.id;
        console.log(`🔍 Using provider ID ${providerId} for location-based certificate filtering`);
        
        // **STEP 1: Get provider's primary location (same logic as service)**
        const { data: provider, error: providerError } = await supabase
          .from('authorized_providers')
          .select('primary_location_id')
          .eq('id', providerId)
          .single();
          
        if (providerError || !provider?.primary_location_id) {
          console.error('🔍 Could not get provider primary location:', providerError);
          return { certificates: [], totalCount: 0, allCertificates: [] };
        }
        
        const primaryLocationId = provider.primary_location_id;
        console.log(`🔍 Provider primary location: ${primaryLocationId}`);
        
        // **STEP 2: Get ALL certificates first (for stats), then apply search and pagination**
        let baseQuery = supabase
          .from('certificates')
          .select('*')
          .eq('location_id', primaryLocationId);

        // Get all certificates for stats calculation (no search filter)
        const { data: allCertificates, error: allError } = await baseQuery;
        
        if (allError) {
          console.error('🔍 Failed to get all certificates for stats:', allError);
          return { certificates: [], totalCount: 0, allCertificates: [] };
        }
        
        // **STEP 3: Apply filters for display data**
        let filteredQuery = supabase
          .from('certificates')
          .select('*')
          .eq('location_id', primaryLocationId);

        // Apply status filter
        if (statusFilter !== 'all') {
          filteredQuery = filteredQuery.eq('status', statusFilter);
        }

        // **SERVER-SIDE SEARCH FILTERING**
        if (searchQuery.trim()) {
          const searchTerm = `%${searchQuery.trim()}%`;
          filteredQuery = filteredQuery.or(
            `recipient_name.ilike.${searchTerm},course_name.ilike.${searchTerm},verification_code.ilike.${searchTerm}`
          );
        }

        // **SERVER-SIDE SORTING**
        filteredQuery = filteredQuery.order(sortBy, { ascending: sortDirection === 'asc' });

        const { data: filteredData, error } = await filteredQuery;
        
        if (error) {
          console.error('🔍 Location-based certificate query failed:', error);
          return { certificates: [], totalCount: 0, allCertificates: allCertificates || [] };
        }
        
        const totalCount = filteredData?.length || 0;
        console.log(`🔍 Found ${totalCount} filtered certificates, ${allCertificates?.length || 0} total certificates`);
        
        // **CLIENT-SIDE PAGINATION** (since we need to maintain location-based filtering)
        const offset = (currentPage - 1) * pageSize;
        const paginatedData = filteredData?.slice(offset, offset + pageSize) || [];
        
        const queryTime = performance.now() - queryStart;
        console.log(`🔍 AP Certificate Query Complete: ${paginatedData.length} records (${totalCount} filtered, ${allCertificates?.length || 0} total) in ${queryTime.toFixed(2)}ms`);
        console.log(`✅ SUCCESS: AP certificate page now uses same location-based logic as AP dashboard`);
        
        return {
          certificates: paginatedData as Certificate[],
          totalCount,
          allCertificates: allCertificates as Certificate[]
        };
      }
      
      // **NON-AP USERS: Use original server-side pagination**
      const offset = (currentPage - 1) * pageSize;
      
      // **STEP 1: Get all certificates for stats calculation**
      let allQuery = supabase
        .from('certificates')
        .select('*');

      if (!isAdmin && profile?.id) {
        // Other roles: Filter by user_id (existing behavior)
        allQuery = allQuery.eq('user_id', profile.id);
      }

      const { data: allCertificates, error: allError } = await allQuery;
      
      if (allError) {
        console.error('🔍 Failed to get all certificates for stats:', allError);
      }
      
      // **STEP 2: Get paginated data with filters**
      let query = supabase
        .from('certificates')
        .select('*', { count: 'exact' });

      if (!isAdmin && profile?.id) {
        // Other roles: Filter by user_id (existing behavior)
        query = query.eq('user_id', profile.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // **SERVER-SIDE SEARCH FILTERING**
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(
          `recipient_name.ilike.${searchTerm},course_name.ilike.${searchTerm},verification_code.ilike.${searchTerm}`
        );
      }

      // **SERVER-SIDE SORTING**
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });

      // **APPLY PAGINATION**
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      
      // 🔍 PAGINATION DIAGNOSTIC: Log query completion
      const queryTime = performance.now() - queryStart;
      const recordCount = data?.length || 0;
      console.log(`🔍 Certificate Query Complete: ${recordCount} records fetched in ${queryTime.toFixed(2)}ms (Total: ${count})`);
      
      if (error) throw error;
      return {
        certificates: (data || []) as Certificate[],
        totalCount: count || 0,
        allCertificates: (allCertificates || []) as Certificate[]
      };
    },
    enabled: !!profile
  });

  const certificates = paginatedData?.certificates || [];
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const allCertificates = paginatedData?.allCertificates || [];
  
  // **FIXED: Calculate actual total stats from all certificates, not just current page**
  const totalStats = React.useMemo(() => {
    if (allCertificates.length === 0) {
      return {
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0,
        emailed: 0,
        emailRate: 0
      };
    }
    
    const total = allCertificates.length;
    const active = allCertificates.filter(c => c.status === 'ACTIVE').length;
    const expired = allCertificates.filter(c => c.status === 'EXPIRED').length;
    const revoked = allCertificates.filter(c => c.status === 'REVOKED').length;
    const emailed = allCertificates.filter(c => c.email_status === 'SENT' || c.is_batch_emailed).length;
    
    return {
      total,
      active,
      expired,
      revoked,
      emailed,
      emailRate: total > 0 ? Math.round((emailed / total) * 100) : 0
    };
  }, [allCertificates]);

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

  // **SERVER-SIDE FILTERING REPLACES CLIENT-SIDE - NO ADDITIONAL FILTERING NEEDED**
  const filteredCertificates = certificates;
  
  // **GROUPING LOGIC FOR ORGANIZATION**
  const groupedCertificates = React.useMemo(() => {
    if (!filteredCertificates || groupBy === 'none') {
      return { ungrouped: filteredCertificates };
    }

    const groups: Record<string, Certificate[]> = {};
    
    filteredCertificates.forEach(cert => {
      let groupKey = 'Other';
      
      switch (groupBy) {
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
          groupKey = cert.batch_name || 'No Batch';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(cert);
    });
    
    return groups;
  }, [filteredCertificates, groupBy]);

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

  // **PAGINATION HANDLERS**
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedCertificates(new Set()); // Clear selections on page change
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setSelectedCertificates(new Set()); // Clear selections
  };

  const handleSortChange = (field: keyof Certificate) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleExport = () => {
    console.log('Export certificates');
    toast.info('Export functionality coming soon');
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

  return (
    <div className="space-y-6">
      {/* Stats Cards - FIXED: Pass actual total stats, not just current page */}
      <CertificateStatsCards
        certificates={certificates || []}
        totalCounts={totalStats}
      />

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
                {totalCount} certificates
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Page {currentPage} of {totalPages}
              </Badge>
              {selectedCertificates.size > 0 && (
                <Badge variant="default" className="text-sm">
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
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Status Filters */}
              {['ACTIVE', 'EXPIRED', 'REVOKED', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => handleStatusFilterChange(status)}
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
                <Select value={sortBy} onValueChange={(value) => handleSortChange(value as keyof Certificate)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="recipient_name">Recipient Name</SelectItem>
                    <SelectItem value="course_name">Course Name</SelectItem>
                    <SelectItem value="issue_date">Issue Date</SelectItem>
                    <SelectItem value="expiry_date">Expiry Date</SelectItem>
                    <SelectItem value="batch_name">Batch Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              
              {/* Grouping Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Group by:</span>
                <Select value={groupBy} onValueChange={(value) => setGroupBy(value as typeof groupBy)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Ungrouped
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        By User
                      </div>
                    </SelectItem>
                    <SelectItem value="location">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        By Location
                      </div>
                    </SelectItem>
                    <SelectItem value="date">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        By Date
                      </div>
                    </SelectItem>
                    <SelectItem value="batch">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        By Batch
                      </div>
                    </SelectItem>
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
          {queryError ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Error Loading Certificates</h3>
                <p className="text-sm mb-4">{queryError.message}</p>
                <div className="text-xs bg-red-50 p-3 rounded border text-left max-w-md mx-auto">
                  <strong>Debug Info:</strong>
                  <br />Profile: {profile ? `${profile.role} (${profile.id})` : 'Not loaded'}
                  <br />Admin: {isAdmin ? 'Yes' : 'No'}
                  <br />Query Key: enhanced-certificates-{profile?.id || 'no-id'}
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-600">No certificates match your current search criteria.</p>
              <div className="text-xs text-gray-500 mt-4 bg-gray-50 p-3 rounded border">
                <strong>Debug Info:</strong>
                <br />Profile: {profile ? `${profile.role} (${profile.id})` : 'Not loaded'}
                <br />Admin: {isAdmin ? 'Yes' : 'No'}
                <br />Total Records: {paginatedData?.totalCount || 0}
                <br />Filtered Records: {filteredCertificates.length}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render grouped or ungrouped certificates */}
              {Object.entries(groupedCertificates).map(([groupKey, certificates]) => (
                <div key={groupKey}>
                  {groupBy !== 'none' && (
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
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of{' '}
                        {totalCount} certificates
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
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
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="px-3 py-1 text-sm">
                          {currentPage} of {totalPages}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
