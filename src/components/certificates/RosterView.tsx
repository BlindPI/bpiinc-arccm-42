
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, parseISO } from "date-fns";
import { Layers, Users, Calendar, Download, Mail, CheckCircle, XCircle, AlertCircle, MapPin } from "lucide-react";
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
  
  // Group certificates by batch_id, with intelligent fallback for legacy certificates
  const groupCertificatesByBatch = () => {
    const groups = new Map();
    
    certificates.forEach(cert => {
      // Use batch_id if available (preferred method)
      let batchId = cert.batch_id || null;
      let batchName = cert.batch_name || null;
      let batchKey = batchId;
      
      // If no batch_id exists, create logical groups based on common attributes
      if (!batchId) {
        if (cert.course_name && cert.issue_date) {
          // Group by course_name + issue_date (normalized to date only)
          const issueDate = cert.issue_date ? cert.issue_date.split('T')[0] : '';
          batchKey = `auto_${cert.course_name}_${issueDate}`;
          batchName = `${cert.course_name} - ${issueDate}`;
          
          // Add instructor name if available
          if (cert.instructor_name) {
            batchName += ` by ${cert.instructor_name}`;
          }
        } else {
          // Last resort - group by created_at date (same day)
          const createdDate = cert.created_at ? 
            new Date(cert.created_at).toISOString().split('T')[0] : 
            'unknown_date';
          batchKey = `auto_date_${createdDate}`;
          batchName = `Certificates from ${createdDate}`;
        }
      }
      
      if (!groups.has(batchKey)) {
        // Extract date information from first element in batch
        const submittedAt = cert.batch_created_at || cert.created_at || new Date().toISOString();
        const submittedBy = cert.batch_created_by_name || 'Unknown';
        const locationName = cert.location_name || null;
        
        groups.set(batchKey, {
          id: batchId || batchKey, // Use actual batch_id if available, otherwise generated key
          name: batchName || 'Ungrouped Certificates',
          submittedAt: submittedAt,
          submittedBy: submittedBy,
          locationName: locationName,
          certificates: []
        });
      }
      groups.get(batchKey).certificates.push(cert);
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
  
  // Format date in a consistent way
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (e) {
      // Handle various date formats or return original if parsing fails
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return format(date, 'PPP');
        }
      } catch (err) {}
      return dateString;
    }
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
            // Extract the course name from the first certificate in the batch
            const courseName = batch.certificates[0]?.course_name || 'Mixed Courses';
            const instructorName = batch.certificates[0]?.instructor_name;
            
            return (
              <AccordionItem 
                key={batch.id}
                value={batch.id}
                className="border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex flex-col items-start text-left gap-1">
                    <div className="font-semibold">
                      {batch.name}
                      {batch.id.startsWith('auto_') && (
                        <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700">
                          Auto-grouped
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(batch.submittedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {stats.total} certificates
                      </div>
                      {batch.locationName && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {batch.locationName}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="px-4 py-2">
                    <div className="flex flex-col gap-2 mb-4">
                      {instructorName && (
                        <div className="text-sm">
                          <span className="font-medium">Instructor:</span> {instructorName}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
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
                              <th className="px-4 py-2 text-left">Issue Date</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {batch.certificates.map((cert: any) => (
                              <tr key={cert.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{cert.recipient_name}</td>
                                <td className="px-4 py-2">{cert.course_name}</td>
                                <td className="px-4 py-2">{formatDate(cert.issue_date)}</td>
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
