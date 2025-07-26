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
  Calendar,
  Users,
  Mail,
  Download,
  RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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
    queryKey: ['enhanced-rosters-fixed', isAdmin, profile?.id],
    queryFn: async () => {
      console.log('🔧 ROSTERS_FIXED: Fetching rosters for user:', profile?.id, 'role:', profile?.role, 'isAdmin:', isAdmin);

      if (!isAdmin && profile?.id && profile?.role === 'AP') {
        // **FIXED: AP users get location-based filtering using RPC function first**
        console.log('🔧 ROSTERS_FIXED: AP user detected - trying RPC function approach');
        
        // Get provider location using our working RPC function
        try {
          const { data: locationId, error: rpcLocationError } = await supabase.rpc('get_ap_user_location', {
            p_user_id: profile.id
          });

          if (!rpcLocationError && locationId) {
            console.log('🔧 ROSTERS_FIXED: Got AP location via RPC:', locationId);
            
            // Use working RPC function to get location rosters
            const { data: rpcRosters, error: rpcRostersError } = await supabase.rpc('get_location_rosters', {
              p_location_id: locationId
            });

            if (!rpcRostersError && rpcRosters && rpcRosters.length > 0) {
              console.log('🔧 ROSTERS_FIXED: RPC function SUCCESS - got', rpcRosters.length, 'rosters');
              
              // Convert RPC result to Roster format
              return rpcRosters.map((item: any) => ({
                id: item.id,
                name: item.name,
                created_by: item.created_by,
                created_at: item.created_at,
                status: 'ACTIVE' as const,
                certificate_count: item.certificate_count || 0,
                course_id: item.course_id,
                location_id: item.location_id,
                description: `Created by: ${item.creator_name}`,
                issue_date: null,
                course: undefined,
                location: undefined,
                creator: undefined
              })) as Roster[];
            } else {
              console.log('🔧 ROSTERS_FIXED: RPC function failed or empty, trying fallback');
            }
          } else {
            console.log('🔧 ROSTERS_FIXED: RPC get_ap_user_location failed, trying fallback');
          }
        } catch (rpcError) {
          console.log('🔧 ROSTERS_FIXED: RPC functions not available, using fallback');
        }

        // **FALLBACK: Original location-based query for AP users**
        console.log('🔧 ROSTERS_FIXED: Using fallback location-based query for AP user');
        
        // Get provider ID and location for this AP user (fallback)
        const { data: apUser, error: apError } = await supabase
          .from('authorized_providers')
          .select('id, primary_location_id')
          .eq('user_id', profile.id)
          .single();
          
        if (apError || !apUser?.primary_location_id) {
          console.error('🔧 ROSTERS_FIXED: Could not find provider/location for AP user:', apError);
          return [];
        }
        
        const locationId = apUser.primary_location_id;
        console.log('🔧 ROSTERS_FIXED: Using fallback location-based filtering for location:', locationId);
        
        // Get rosters for this location (fallback query)
        const { data, error } = await supabase
          .from('rosters')
          .select('*')
          .eq('location_id', locationId)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('🔧 ROSTERS_FIXED: Location-based roster fallback query failed:', error);
          throw error;
        }

        console.log('🔧 ROSTERS_FIXED: AP user location-based fallback rosters found:', data?.length || 0);
        
        return (data || []).map(item => ({
          ...item,
          status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
          course: undefined,
          location: undefined,
          creator: undefined
        })) as Roster[];
      }

      // **ADMIN USERS or OTHER ROLES**: Use original logic
      let query = supabase
        .from('rosters')
        .select('*');

      if (!isAdmin && profile?.id) {
        // Other roles: Filter by created_by (existing behavior)
        console.log('🔧 ROSTERS_FIXED: Non-AP user - filtering by created_by');
        query = query.eq('created_by', profile.id);
      } else {
        console.log('🔧 ROSTERS_FIXED: Admin user - no filtering');
      }

      const { data, error } = await query
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('🔧 ROSTERS_FIXED: Standard roster query failed:', error);
        throw error;
      }
      
      console.log('🔧 ROSTERS_FIXED: Standard rosters found:', data?.length || 0);
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
        course: undefined,
        location: undefined,
        creator: undefined
      })) as Roster[];
    },
    enabled: !!profile,
    staleTime: 30000, // 30 seconds - shorter cache time
    gcTime: 60000 // 1 minute
  });

  const filteredRosters = rosters?.filter(roster => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      roster.name?.toLowerCase().includes(searchLower) ||
      roster.description?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleViewDetails = async (roster: Roster) => {
    try {
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', roster.id);

      if (error) throw error;

      setSelectedRoster(roster);
      setRosterCertificates(certificates || []);
    } catch (error) {
      console.error('Error fetching roster certificates:', error);
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

      const certsWithoutEmail = certificates.filter(cert => !cert.recipient_email);
      if (certsWithoutEmail.length > 0) {
        toast.warning(`${certsWithoutEmail.length} certificates have no email address`);
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
    // Refresh email status
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
                {rosters && rosters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {rosters.length} Found
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
            {/* Debug info for AP users */}
            {profile?.role === 'AP' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                <span className="font-medium text-blue-700">AP User:</span>
                <span className="text-blue-600 ml-2">
                  Showing rosters for your assigned location using RPC functions
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rosters List */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">Loading rosters...</div>
            ) : filteredRosters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="space-y-2">
                  <p>No rosters found matching your criteria</p>
                  {profile?.role === 'AP' && (
                    <p className="text-sm text-blue-600">
                      Checked for rosters at your assigned location using RPC functions
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRosters.map((roster) => (
                  <Card key={roster.id} className="border rounded-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            <Layers className="h-5 w-5 text-primary" />
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{roster.name}</span>
                              <Badge variant={roster.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {roster.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <div className="font-medium">{format(new Date(roster.created_at), 'MMM dd, yyyy')}</div>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Certificates:</span>
                              <div className="font-medium">{roster.certificate_count}</div>
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
                          
                          {/* Description */}
                          {roster.description && (
                            <div className="text-sm text-gray-600">
                              {roster.description}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(roster)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>

                          {roster.certificate_count > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmailRoster(roster.id, roster.name)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email Roster
                            </Button>
                          )}
                          
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