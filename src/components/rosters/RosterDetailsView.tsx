import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRosterDetail } from '@/hooks/useRosters';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RosterStatistics } from './RosterStatistics';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function RosterDetailsView() {
  const { rosterId } = useParams<{ rosterId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { roster, certificates = [], statistics, isLoading, isLoadingCertificates } = useRosterDetail(rosterId || '');
  const { generateCertificatesZip } = useCertificateOperations();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Add downloadCertificate function
  const downloadCertificate = async (certificateId: string) => {
    try {
      // Get certificate URL
      const { data, error } = await supabase
        .from('certificates')
        .select('certificate_url')
        .eq('id', certificateId)
        .single();
      
      if (error || !data) {
        throw new Error('Certificate not found');
      }
      
      if (!data.certificate_url) {
        toast.error('Certificate URL not available');
        return;
      }
      
      // Open in new window
      window.open(data.certificate_url, '_blank');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  // Filter certificates based on search query
  const filteredCertificates = React.useMemo(() => {
    if (!certificates) return [];
    if (!searchQuery.trim()) return certificates;

    return certificates.filter(cert => 
      cert.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.course_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [certificates, searchQuery]);

  const handleArchiveRoster = async () => {
    if (!rosterId) return;
    
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('rosters')
        .update({ status: 'ARCHIVED' })
        .eq('id', rosterId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Roster archived successfully');
      navigate('/rosters');
    } catch (error) {
      console.error('Error archiving roster:', error);
      toast.error('Failed to archive roster');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDownloadAllCertificates = async () => {
    if (!rosterId || !certificates.length) return;
    
    setIsDownloading(true);
    try {
      // Extract certificate IDs
      const certificateIds = certificates.map(cert => cert.id);
      if (certificateIds.length > 0) {
        await generateCertificatesZip(certificateIds, roster?.name || 'roster');
        toast.success('Certificates downloaded successfully');
      } else {
        toast.error('No certificates to download');
      }
    } catch (error) {
      console.error('Error downloading certificates:', error);
      toast.error('Failed to download certificates');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewCertificate = (certificateUrl: string) => {
    if (!certificateUrl) {
      toast.error('Certificate URL not available');
      return;
    }
    
    window.open(certificateUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="warning">Expired</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Need to define this component
  const RosterDetailsHeader = ({ roster, onArchive, onDownload, isArchiving, isDownloading }) => {
    if (!roster) return null;
    
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{roster.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <span>Created {format(new Date(roster.created_at), 'MMM d, yyyy')}</span>
            {roster.creator_name && <span>by {roster.creator_name}</span>}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onDownload}
            variant="outline"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="flex items-center">Downloading...</span>
            ) : (
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </span>
            )}
          </Button>
          
          <Button
            onClick={onArchive}
            variant="outline"
            disabled={isArchiving || roster.status === 'ARCHIVED'}
          >
            {isArchiving ? 'Archiving...' : 'Archive Roster'}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px] mt-6" />
      </div>
    );
  }

  if (!roster) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Roster not found</h2>
        <p className="text-muted-foreground mb-6">The roster you're looking for does not exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/rosters')}>Back to Rosters</Button>
      </div>
    );
  }

  return (
    <div>
      <RosterDetailsHeader
        roster={roster}
        onArchive={handleArchiveRoster}
        onDownload={handleDownloadAllCertificates}
        isArchiving={isArchiving}
        isDownloading={isDownloading}
      />
      
      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificates" className="mt-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates by name or course..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCertificates ? (
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {certificates.length === 0 ? 'No certificates in this roster' : 'No certificates match your search'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.recipient_name}</TableCell>
                      <TableCell>{cert.course_name}</TableCell>
                      <TableCell>{format(new Date(cert.issue_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {cert.certificate_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewCertificate(cert.certificate_url!)}
                            title="View Certificate"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadCertificate(cert.id)}
                          title="Download Certificate"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics" className="mt-6">
          {statistics && <RosterStatistics roster={roster} statistics={statistics} isLoading={isLoadingCertificates} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
