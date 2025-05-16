import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RosterUpload } from '@/types/certificates';

export function RosterList() {
  const [expandedRosters, setExpandedRosters] = React.useState<Set<string>>(new Set());
  
  const { data: rosters, isLoading: rostersLoading } = useQuery({
    queryKey: ['rosters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });
  
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['certificates_by_roster'],
    queryFn: async () => {
      // Join certificates with certificate_requests to get roster_id
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          certificate_request:certificate_request_id (
            roster_id
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });
  
  const toggleRoster = (rosterId: string) => {
    setExpandedRosters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rosterId)) {
        newSet.delete(rosterId);
      } else {
        newSet.add(rosterId);
      }
      return newSet;
    });
  };
  
  // Group certificates by roster
  const certificatesByRoster = React.useMemo(() => {
    if (!certificates) return {};
    
    const grouped: Record<string, any[]> = {};
    
    // First, add all certificates with roster_id to their respective groups
    certificates.forEach(cert => {
      const rosterId = cert.certificate_request?.roster_id;
      if (rosterId) {
        if (!grouped[rosterId]) {
          grouped[rosterId] = [];
        }
        grouped[rosterId].push(cert);
      }
    });
    
    // Add an "Ungrouped" category for certificates without roster_id
    grouped['ungrouped'] = certificates.filter(cert => !cert.certificate_request?.roster_id);
    
    return grouped;
  }, [certificates]);
  
  if (rostersLoading || certificatesLoading) {
    return <div>Loading rosters and certificates...</div>;
  }
  
  return (
    <div className="space-y-6">
      {rosters?.map((roster: RosterUpload) => {
        const rosterCertificates = certificatesByRoster[roster.id] || [];
        const isExpanded = expandedRosters.has(roster.id);
        
        return (
          <Collapsible key={roster.id} open={isExpanded} onOpenChange={() => toggleRoster(roster.id)}>
            <Card>
              <CardHeader className="py-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{roster.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(roster.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rosterCertificates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No certificates found for this roster
                            </TableCell>
                          </TableRow>
                        ) : (
                          rosterCertificates.map(cert => (
                            <TableRow key={cert.id}>
                              <TableCell>{cert.recipient_name}</TableCell>
                              <TableCell>{cert.course_name}</TableCell>
                              <TableCell>{format(new Date(cert.issue_date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  cert.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800'
                                    : cert.status === 'EXPIRED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {cert.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
      
      {/* Ungrouped Certificates Section */}
      <Collapsible open={expandedRosters.has('ungrouped')} onOpenChange={() => toggleRoster('ungrouped')}>
        <Card>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Ungrouped Certificates</CardTitle>
                </div>
                {expandedRosters.has('ungrouped') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!certificatesByRoster['ungrouped'] || certificatesByRoster['ungrouped']?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No ungrouped certificates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificatesByRoster['ungrouped']?.map(cert => (
                        <TableRow key={cert.id}>
                          <TableCell>{cert.recipient_name}</TableCell>
                          <TableCell>{cert.course_name}</TableCell>
                          <TableCell>{format(new Date(cert.issue_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cert.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800'
                                : cert.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {cert.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}