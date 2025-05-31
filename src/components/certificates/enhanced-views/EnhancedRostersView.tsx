
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  BarChart3,
  Layers,
  Calendar,
  Users,
  Mail,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Roster } from '@/types/roster';
import { Certificate } from '@/types/certificates';
import { RosterDetailsView } from '@/components/certificates/roster/RosterDetailsView';
import { RosterReportDialog } from '@/components/certificates/roster/RosterReportDialog';
import { BatchCertificateEmailForm } from '@/components/certificates/BatchCertificateEmailForm';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function EnhancedRostersView() {
  const { data: profile } = useProfile();
  const { generateCertificatesZip } = useCertificateOperations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoster, setSelectedRoster] = useState<Roster | null>(null);
  const [rosterCertificates, setRosterCertificates] = useState<Certificate[]>([]);
  const [reportDialog, setReportDialog] = useState<{ open: boolean; rosterId: string; rosterName: string }>({
    open: false,
    rosterId: '',
    rosterName: ''
  });
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; certificates: Certificate[] }>({
    open: false,
    certificates: []
  });

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: rosters, isLoading } = useQuery({
    queryKey: ['enhanced-rosters', isAdmin, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('rosters')
        .select('*');

      if (!isAdmin && profile?.id) {
        query = query.eq('created_by', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
        course: undefined,
        location: undefined,
        creator: undefined
      })) as Roster[];
    },
    enabled: !!profile
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

  const handleGenerateReport = (rosterId: string, rosterName: string) => {
    setReportDialog({ open: true, rosterId, rosterName });
  };

  const handleBulkEmail = (certificates: Certificate[]) => {
    setEmailDialog({ open: true, certificates });
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
        onBulkEmail={handleBulkEmail}
        onBulkDownload={handleBulkDownload}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Certificate Rosters
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
        </CardContent>
      </Card>

      {/* Rosters List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading rosters...</div>
          ) : filteredRosters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rosters found matching your criteria
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <div className="font-medium">{format(new Date(roster.created_at), 'MMM dd, yyyy')}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Certificates:</span>
                            <div className="font-medium">{roster.certificate_count}</div>
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

      {/* Report Dialog */}
      <RosterReportDialog
        rosterId={reportDialog.rosterId}
        rosterName={reportDialog.rosterName}
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog(prev => ({ ...prev, open }))}
      />

      {/* Email Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          {emailDialog.certificates.length > 0 && (
            <BatchCertificateEmailForm
              certificateIds={emailDialog.certificates.map(c => c.id)}
              certificates={emailDialog.certificates}
              onClose={() => setEmailDialog({ open: false, certificates: [] })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
