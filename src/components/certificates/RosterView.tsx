
import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { Layers, Users, Calendar, Download, Mail, CheckCircle, XCircle, AlertCircle, Search, Copy, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCertificateOperations } from "@/hooks/useCertificateOperations";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BatchCertificateEmailForm } from './BatchCertificateEmailForm';

interface RosterViewProps {
  certificates: any[];
  isLoading: boolean;
}

export function RosterView({ certificates, isLoading }: RosterViewProps) {
  const { generateCertificatesZip, isDownloading } = useCertificateOperations();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedBatchForEmail, setSelectedBatchForEmail] = useState<{
    certificates: any[];
    certificateIds: string[];
  } | null>(null);
  
  // Debug logging for the received certificates
  React.useEffect(() => {
    console.log('RosterView received certificates:', certificates);
    
    // Log certificates with roster or batch information
    const withRosterId = certificates.filter(cert => cert.roster_id);
    const withBatchId = certificates.filter(cert => cert.batch_id);
    console.log(`Certificates with roster_id: ${withRosterId.length}`, withRosterId);
    console.log(`Certificates with batch_id: ${withBatchId.length}`, withBatchId);
  }, [certificates]);
  
  // Group certificates by batch_id
  const groupCertificatesByBatch = () => {
    console.log('Starting to group certificates by batch...');
    
    const groups = new Map();
    
    certificates.forEach(cert => {
      console.log('Processing certificate for grouping:', {
        id: cert.id, 
        recipient: cert.recipient_name,
        batch_id: cert.batch_id,
        roster_id: cert.roster_id,
        batch_name: cert.batch_name
      });
      
      // First try to use roster_id if available
      const groupId = cert.roster_id || cert.batch_id || 'ungrouped';
      
      if (!groups.has(groupId)) {
        const groupName = cert.batch_name || 'Ungrouped Certificates';
        console.log(`Creating new group with ID ${groupId} and name "${groupName}"`);
        
        groups.set(groupId, {
          id: groupId,
          name: groupName,
          submittedAt: cert.created_at,
          submittedBy: cert.issued_by_name || 'Unknown',
          certificates: []
        });
      }
      
      groups.get(groupId).certificates.push(cert);
    });
    
    const result = Array.from(groups.values());
    console.log(`Grouped certificates into ${result.length} batches:`, result);
    return result;
  };
  
  // Apply search filter and sorting
  const filteredAndSortedBatches = useMemo(() => {
    const grouped = groupCertificatesByBatch();
    console.log('Grouped batches:', grouped);
    
    // Filter by search query
    const filtered = grouped.filter(batch => 
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Also search through certificate recipients
      batch.certificates.some((cert: any) => 
        cert.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.course_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    
    console.log(`Filtered ${grouped.length} batches to ${filtered.length} based on search "${searchQuery}"`);
    
    // Sort by submission date or roster ID
    return filtered.sort((a, b) => {
      // Primary sort by date
      const dateComparison = sortOrder === 'desc'
        ? new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        : new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        
      // If dates are the same, sort by roster ID
      if (dateComparison === 0) {
        return sortOrder === 'desc'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      
      return dateComparison;
    });
  }, [certificates, searchQuery, sortOrder]);
  
  // Handle downloading all certificates in a batch
  const handleBatchDownload = async (batchId: string) => {
    const batchCertificates = filteredAndSortedBatches.find(b => b.id === batchId)?.certificates || [];
    if (batchCertificates.length > 0) {
      const certificateIds = batchCertificates.map(cert => cert.id);
      await generateCertificatesZip(certificateIds, batchCertificates);
    } else {
      toast.error("No certificates found in this batch to download");
    }
  };
  
  // Generate statistics for a batch
  const getBatchStatistics = (batchCerts: any[]) => {
    const total = batchCerts.length;
    const active = batchCerts.filter(cert => cert.status === 'ACTIVE').length;
    const expired = batchCerts.filter(cert => cert.status === 'EXPIRED').length;
    const revoked = batchCerts.filter(cert => cert.status === 'REVOKED').length;
    const emailed = batchCerts.filter(cert => cert.is_batch_emailed).length;
    
    return { total, active, expired, revoked, emailed };
  };

  // Copy roster ID to clipboard
  const copyRosterId = (rosterId: string) => {
    navigator.clipboard.writeText(rosterId);
    toast.success('Roster ID copied to clipboard');
  };
  
  // Check if a batch has been emailed
  const isBatchEmailed = (batchCerts: any[]) => {
    return batchCerts.some(cert => cert.is_batch_emailed);
  };

  // Handle sending emails to all certificates in a batch
  const handleBatchEmail = (batchId: string) => {
    const batchCertificates = filteredAndSortedBatches.find(b => b.id === batchId)?.certificates || [];
    if (batchCertificates.length === 0) {
      toast.error("No certificates found in this batch to email");
      return;
    }
    
    const certificateIds = batchCertificates.map(cert => cert.id);
    
    setSelectedBatchForEmail({
      certificates: batchCertificates,
      certificateIds
    });
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setSelectedBatchForEmail(null);
  };
  
  // Debug logging to help diagnose certificate visibility
  React.useEffect(() => {
    console.log(`RosterView received ${certificates?.length || 0} certificates`);
    console.log('Grouped into', filteredAndSortedBatches.length, 'batches');
  }, [certificates, filteredAndSortedBatches.length]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-pulse flex flex-col items-center">
          <Layers className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-gray-500">Loading certificate rosters...</p>
        </div>
      </div>
    );
  }
  
  if (filteredAndSortedBatches.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50/50 rounded-lg border">
        <Layers className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No certificate rosters found</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Certificate rosters will appear here once you have approved certificate requests in batches.
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px]">
        <div className="p-4">
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">{filteredAndSortedBatches.length} certificate {filteredAndSortedBatches.length === 1 ? 'roster' : 'rosters'} found</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
                <Input
                  placeholder="Search rosters or recipients..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="text-xs"
              >
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </Button>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {filteredAndSortedBatches.map((batch) => {
              const stats = getBatchStatistics(batch.certificates);
              
              return (
                <AccordionItem 
                  key={batch.id}
                  value={batch.id}
                  className="border rounded-lg overflow-hidden bg-white shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex flex-col items-start text-left gap-1 w-full">
                      <div className="flex justify-between w-full">
                        <div className="font-semibold">{batch.name}</div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700">{stats.active} Active</Badge>
                          {stats.expired > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{stats.expired} Expired</Badge>
                          )}
                          {stats.revoked > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">{stats.revoked} Revoked</Badge>
                          )}
                          {isBatchEmailed(batch.certificates) && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                              <MailCheck className="h-3 w-3" />
                              <span>Emailed</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(batch.submittedAt), 'PPP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {stats.total} certificates
                        </div>
                        {isBatchEmailed(batch.certificates) && (
                          <div className="flex items-center gap-1">
                            <MailCheck className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-blue-600">{stats.emailed} emailed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="px-4 py-2">
                      <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium">Roster Details</div>
                          <div className="flex items-center mt-1 text-sm">
                            <span className="font-semibold mr-1">ID:</span> 
                            <span className="text-primary">{batch.name}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 ml-1"
                              onClick={() => copyRosterId(batch.name)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Submitted by:</span> {batch.submittedBy}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Date:</span> {format(new Date(batch.submittedAt), 'PPP p')}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleBatchDownload(batch.id)}
                            disabled={isDownloading}
                          >
                            <Download className="h-4 w-4" />
                            {isDownloading ? 'Processing...' : `Download All (${stats.total})`}
                          </Button>
                          <Button
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleBatchEmail(batch.id)}
                            disabled={isBatchEmailed(batch.certificates) && stats.emailed === stats.total}
                          >
                            {isBatchEmailed(batch.certificates) && stats.emailed === stats.total ? (
                              <>
                                <MailCheck className="h-4 w-4" />
                                Already Emailed
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4" />
                                {isBatchEmailed(batch.certificates) ? 'Email Remaining' : 'Email All'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Certificates in this roster:</h4>
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full">
                            <thead className="bg-gray-50 text-xs">
                              <tr>
                                <th className="px-4 py-2 text-left">Recipient</th>
                                <th className="px-4 py-2 text-left">Course</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {batch.certificates.map((cert: any) => (
                                <tr key={cert.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2">{cert.recipient_name}</td>
                                  <td className="px-4 py-2">{cert.course_name}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {cert.status === 'ACTIVE' && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                                      )}
                                      {cert.status === 'EXPIRED' && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Expired</Badge>
                                      )}
                                      {cert.status === 'REVOKED' && (
                                        <Badge variant="outline" className="bg-red-50 text-red-700">Revoked</Badge>
                                      )}
                                      {cert.is_batch_emailed && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                                          <MailCheck className="h-3 w-3" />
                                          <span>Emailed</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {cert.certificate_url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:bg-transparent"
                                        onClick={async () => {
                                          if (cert.certificate_url) {
                                            window.open(cert.certificate_url, '_blank');
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>

      {/* Batch Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Certificate Emails</DialogTitle>
          </DialogHeader>
          {selectedBatchForEmail && (
            <BatchCertificateEmailForm
              certificateIds={selectedBatchForEmail.certificateIds}
              certificates={selectedBatchForEmail.certificates}
              onClose={handleCloseEmailDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
