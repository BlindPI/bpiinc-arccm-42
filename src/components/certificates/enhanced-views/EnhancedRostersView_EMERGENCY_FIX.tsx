import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  BarChart3,
  Layers,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Roster } from '@/types/roster';
import { Certificate } from '@/types/certificates';
import { RosterDetailsView } from '@/components/certificates/roster/RosterDetailsView';
import { RosterReportDialog } from '@/components/certificates/roster/RosterReportDialog';
import { BatchCertificateEmailForm } from '@/components/certificates/BatchCertificateEmailForm';
import { RosterEmailStatusBadge } from '@/components/rosters/RosterEmailStatusBadge';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { useCacheRefresh } from '@/hooks/useCacheRefresh';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function EnhancedRostersView() {
  const { data: profile } = useProfile();
  const { generateCertificatesZip } = useCertificateOperations();
  const { refreshEmailStatus } = useCacheRefresh();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoster, setSelectedRoster] = useState<Roster | null>(null);
  const [rosterCertificates, setRosterCertificates] = useState<Certificate[]>([]);
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    rosterId: string;
    rosterName: string;
    certificates: Certificate[];
  }>({
    open: false,
    rosterId: '',
    rosterName: '',
    certificates: []
  });
  const [reportDialog, setReportDialog] = useState<{ open: boolean; rosterId: string; rosterName: string }>({
    open: false,
    rosterId: '',
    rosterName: ''
  });

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: rosters, isLoading } = useQuery({
    queryKey: ['enhanced-rosters-emergency-fix', isAdmin, profile?.id],
    queryFn: async () => {
      console.log('🚨 EMERGENCY_FIX: Fetching rosters for user:', profile?.id, 'role:', profile?.role, 'isAdmin:', isAdmin);

      if (isAdmin) {
        // **EMERGENCY: SA/AD USERS MUST SEE ALL ROSTERS INCLUDING PENDING**
        console.log('🚨 EMERGENCY_FIX: SA/AD user - fetching ALL rosters (including PENDING)');
        
        const { data, error } = await supabase
          .from('rosters')
          .select('*')
          .in('status', ['PENDING', 'ACTIVE', 'DRAFT', 'ARCHIVED'])  // ALL statuses
          .order('created_at', { ascending: false });

        if (error) {
          console.error('🚨 EMERGENCY_FIX: SA/AD roster query failed:', error);
          throw error;
        }

        console.log('🚨 EMERGENCY_FIX: SA/AD found:', data?.length || 0, 'total rosters');
        
        // Count by status for debug
        const statusCounts = (data || []).reduce((acc, roster) => {
          acc[roster.status] = (acc[roster.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('🚨 EMERGENCY_FIX: SA/AD roster counts by status:', statusCounts);
        
        return (data || []).map(item => ({
          ...item,
          status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'PENDING',
          course: undefined,
          location: undefined,
          creator: undefined
        })) as Roster[];
      }

      if (!isAdmin && profile?.id && profile?.role === 'AP') {
        // **AP users - location-based filtering (ACTIVE only)**
        console.log('🚨 EMERGENCY_FIX: AP user detected - using location-based filtering');
        
        const { data: apUser, error: apError } = await supabase
          .from('authorized_providers')
          .select('id, primary_location_id')
          .eq('user_id', profile.id)
          .single();
          
        if (apError || !apUser?.primary_location_id) {
          console.error('🚨 EMERGENCY_FIX: Could not find provider/location for AP user:', apError);
          return [];
        }
        
        const locationId = apUser.primary_location_id;
        console.log('🚨 EMERGENCY_FIX: AP using location ID:', locationId);
        
        const { data, error } = await supabase
          .from('rosters')
          .select('*')
          .eq('location_id', locationId)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('🚨 EMERGENCY_FIX: AP roster query failed:', error);
          return [];
        }

        console.log('🚨 EMERGENCY_FIX: AP found:', data?.length || 0, 'active rosters');
        
        return (data || []).map(item => ({
          ...item,
          status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
          course: undefined,
          location: undefined,
          creator: undefined
        })) as Roster[];
      }

      // **OTHER ROLES**: Filter by created_by (ACTIVE only)
      console.log('🚨 EMERGENCY_FIX: Other user - filtering by created_by');
      
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .eq('created_by', profile?.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('🚨 EMERGENCY_FIX: Other user roster query failed:', error);
        return [];
      }
      
      console.log('🚨 EMERGENCY_FIX: Other user found:', data?.length || 0, 'active rosters');
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
        course: undefined,
        location: undefined,
        creator: undefined
      })) as Roster[];
    },
    enabled: !!profile,
    staleTime: 10000, // Shorter cache for emergency fix
    gcTime: 30000
  });

  const filteredRosters = rosters?.filter(roster => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      roster.name?.toLowerCase().includes(searchLower) ||
      roster.description?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Group rosters by status for better visibility
  const rostersByStatus = filteredRosters.reduce((acc, roster) => {
    const status = roster.status || 'UNKNOWN';
    if (!acc[status]) acc[status] = [];
    acc[status].push(roster);
    return acc;
  }, {} as Record<string, typeof filteredRosters>);

  const handleViewDetails = async (roster: Roster) => {
    try {
      const [certificatesResult, requestsResult] = await Promise.all([
        supabase
          .from('certificates')
          .select('*')
          .eq('roster_id', roster.id),
        supabase
          .from('certificate_requests')
          .select('*')
          .eq('roster_id', roster.id)
      ]);

      let certificates = certificatesResult.data || [];
      
      if (certificates.length === 0 && requestsResult.data && requestsResult.data.length > 0) {
        certificates = requestsResult.data.map(req => ({
          ...req,
          id: req.id,
          recipient_name: req.recipient_name,
          course_name: req.course_name,
          status: req.status,
          roster_id: req.roster_id
        })) as Certificate[];
      }

      setSelectedRoster(roster);
      setRosterCertificates(certificates);
    } catch (error) {
      console.error('Error fetching roster details:', error);
      toast.error('Failed to load roster details');
    }
  };

  const handleEmailRoster = async (rosterId: string, rosterName: string) => {
    try {
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', rosterId);

      if (error) throw error;

      if (!certificates || certificates.length === 0) {
        toast.warning('No certificates found for this roster');
        return;
      }

      setEmailDialog({
        open: true,
        rosterId,
        rosterName,
        certificates: certificates as Certificate[]
      });
    } catch (error) {
      console.error('Error fetching roster certificates:', error);
      toast.error('Failed to load roster certificates');
    }
  };

  const handleEmailDialogClose = () => {
    setEmailDialog(prev => ({ ...prev, open: false }));
    refreshEmailStatus();
  };

  const handleGenerateReport = (rosterId: string, rosterName: string) => {
    setReportDialog({ open: true, rosterId, rosterName });
  };

  const handleBulkDownload = async (certificates: Certificate[]) => {
    const certificateIds = certificates.map(c => c.id);
    await generateCertificatesZip(certificateIds, certificates);
  };

  if (selectedRoster) {
    return (
      <RosterDetailsView
        roster={selectedRoster}
        certificates={rosterCertificates}
        onBack={() => setSelectedRoster(null)}
        onGenerateReport={(rosterId) => handleGenerateReport(rosterId, selectedRoster.name)}
        onBulkDownload={handleBulkDownload}
      />
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'destructive';
      case 'ACTIVE': return 'default';
      case 'DRAFT': return 'secondary';
      case 'ARCHIVED': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Certificate Rosters
                {isAdmin && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    EMERGENCY FIX ACTIVE
                  </Badge>
                )}
                {rosters && rosters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {rosters.length} Total
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEmailStatus}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rosters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Emergency status info */}
            {isAdmin && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                <span className="font-medium text-red-700">🚨 EMERGENCY FIX APPLIED:</span>
                <span className="text-red-600 ml-2">
                  SA/AD users can now see ALL roster statuses (PENDING, ACTIVE, DRAFT, ARCHIVED)
                </span>
              </div>
            )}
            {profile?.role === 'AP' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                <span className="font-medium text-blue-700">AP User:</span>
                <span className="text-blue-600 ml-2">
                  Showing ACTIVE rosters for your assigned location
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary for Admin */}
        {isAdmin && Object.keys(rostersByStatus).length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">Status Summary:</span>
                {Object.entries(rostersByStatus).map(([status, statusRosters]) => (
                  <Badge key={status} variant={getStatusBadgeVariant(status)} className="gap-1">
                    {status}: {statusRosters.length}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rosters List */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">Loading rosters...</div>
            ) : filteredRosters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="space-y-2">
                  <p>No rosters found matching your criteria</p>
                  {isAdmin && (
                    <p className="text-sm text-red-600">
                      🚨 Emergency fix applied - should show ALL rosters including PENDING
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by status for Admin users */}
                {isAdmin ? (
                  Object.entries(rostersByStatus).map(([status, statusRosters]) => (
                    <div key={status} className="space-y-4">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {status} ({statusRosters.length})
                        </Badge>
                      </h3>
                      {statusRosters.map((roster) => (
                        <Card key={roster.id} className="border rounded-md">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <Layers className="h-5 w-5 text-primary" />
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{roster.name}</span>
                                    <Badge variant={getStatusBadgeVariant(roster.status)}>
                                      {roster.status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Created:</span>
                                    <div className="font-medium">{format(new Date(roster.created_at), 'MMM dd, yyyy')}</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Certificates:</span>
                                    <div className="font-medium">{roster.certificate_count || 0}</div>
                                  </div>

                                  <div>
                                    <span className="text-gray-500">Email Status:</span>
                                    <div className="mt-1">
                                      <RosterEmailStatusBadge 
                                        rosterId={roster.id}
                                        certificateCount={roster.certificate_count}
                                      />
                                    </div>
                                  </div>
                                  
                                  {roster.issue_date && (
                                    <div>
                                      <span className="text-gray-500">Issue Date:</span>
                                      <div className="font-medium">{format(new Date(roster.issue_date), 'MMM dd, yyyy')}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(roster)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateReport(roster.id, roster.name)}
                                >
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Generate Report
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))
                ) : (
                  // Non-admin: simple list
                  filteredRosters.map((roster) => (
                    <Card key={roster.id} className="border rounded-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Layers className="h-5 w-5 text-primary" />
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{roster.name}</span>
                                <Badge variant={getStatusBadgeVariant(roster.status)}>
                                  {roster.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Created:</span>
                                <div className="font-medium">{format(new Date(roster.created_at), 'MMM dd, yyyy')}</div>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Certificates:</span>
                                <div className="font-medium">{roster.certificate_count || 0}</div>
                              </div>

                              <div>
                                <span className="text-gray-500">Email Status:</span>
                                <div className="mt-1">
                                  <RosterEmailStatusBadge 
                                    rosterId={roster.id}
                                    certificateCount={roster.certificate_count}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(roster)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateReport(roster.id, roster.name)}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Roster Certificates</DialogTitle>
          </DialogHeader>
          <BatchCertificateEmailForm
            certificateIds={emailDialog.certificates.map(cert => cert.id)}
            certificates={emailDialog.certificates}
            onClose={handleEmailDialogClose}
            batchName={`Roster ${emailDialog.rosterName}`}
          />
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <RosterReportDialog
        rosterId={reportDialog.rosterId}
        rosterName={reportDialog.rosterName}
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog(prev => ({ ...prev, open }))}
      />
    </>
  );
}