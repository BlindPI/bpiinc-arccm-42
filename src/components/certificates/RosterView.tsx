
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { Layers, Users, Calendar, Download, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCertificateOperations } from "@/hooks/useCertificateOperations";

interface RosterViewProps {
  certificates: any[];
  isLoading: boolean;
}

export function RosterView({ certificates, isLoading }: RosterViewProps) {
  const { generateCertificatesZip, isDownloading } = useCertificateOperations();
  
  // Group certificates by batch_id
  const groupCertificatesByBatch = () => {
    const groups = new Map();
    
    certificates.forEach(cert => {
      const batchId = cert.batch_id || 'ungrouped';
      if (!groups.has(batchId)) {
        groups.set(batchId, {
          id: batchId,
          name: cert.batch_name || 'Ungrouped Certificates',
          submittedAt: cert.batch_created_at || cert.created_at,
          submittedBy: cert.batch_created_by_name || 'Unknown',
          certificates: []
        });
      }
      groups.get(batchId).certificates.push(cert);
    });
    
    return Array.from(groups.values())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };
  
  const batches = groupCertificatesByBatch();
  
  // Handle downloading all certificates in a batch
  const handleBatchDownload = async (batchId: string) => {
    const batchCertificates = batches.find(b => b.id === batchId)?.certificates || [];
    if (batchCertificates.length > 0) {
      const certificateIds = batchCertificates.map(cert => cert.id);
      await generateCertificatesZip(certificateIds, batchCertificates);
    }
  };
  
  // Generate statistics for a batch
  const getBatchStatistics = (batchCerts: any[]) => {
    const total = batchCerts.length;
    const active = batchCerts.filter(cert => cert.status === 'ACTIVE').length;
    const expired = batchCerts.filter(cert => cert.status === 'EXPIRED').length;
    const revoked = batchCerts.filter(cert => cert.status === 'REVOKED').length;
    
    return { total, active, expired, revoked };
  };
  
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
  
  if (batches.length === 0) {
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
    <ScrollArea className="h-[600px]">
      <div className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium">{batches.length} certificate {batches.length === 1 ? 'roster' : 'rosters'} found</span>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {batches.map((batch) => {
            const stats = getBatchStatistics(batch.certificates);
            
            return (
              <AccordionItem 
                key={batch.id}
                value={batch.id}
                className="border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex flex-col items-start text-left gap-1">
                    <div className="font-semibold">{batch.name}</div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(batch.submittedAt), 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {stats.total} certificates
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="px-4 py-2">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {stats.active} Active
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {stats.expired} Expired
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {stats.revoked} Revoked
                      </Badge>
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
                        Download All ({stats.total})
                      </Button>
                      <Button
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        disabled={true} // Implement email functionality later
                      >
                        <Mail className="h-4 w-4" />
                        Email All
                      </Button>
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
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {batch.certificates.map((cert: any) => (
                              <tr key={cert.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{cert.recipient_name}</td>
                                <td className="px-4 py-2">{cert.course_name}</td>
                                <td className="px-4 py-2">
                                  {cert.status === 'ACTIVE' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                                  )}
                                  {cert.status === 'EXPIRED' && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Expired</Badge>
                                  )}
                                  {cert.status === 'REVOKED' && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700">Revoked</Badge>
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
  );
}
