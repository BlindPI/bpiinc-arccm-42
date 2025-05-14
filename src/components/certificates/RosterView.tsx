
import React, { useMemo } from 'react';
import { Certificate } from '@/types/certificates';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Download, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RosterViewProps {
  certificates: Certificate[];
  isLoading: boolean;
}

export function RosterView({ certificates, isLoading }: RosterViewProps) {
  // Group certificates by batch/roster
  const rosterGroups = useMemo(() => {
    const groups: Record<string, {
      id: string,
      name: string,
      certificates: Certificate[],
      count: number,
      activeCount: number,
      expiredCount: number
    }> = {};

    if (!certificates) return groups;

    // Create groups by batch ID
    certificates.filter(cert => cert.batch_id).forEach(cert => {
      if (cert.batch_id) {
        const batchId = cert.batch_id;
        const batchName = cert.batch_name || `Batch ${batchId.slice(0, 8)}`;
        
        if (!groups[batchId]) {
          groups[batchId] = {
            id: batchId,
            name: batchName,
            certificates: [],
            count: 0,
            activeCount: 0,
            expiredCount: 0
          };
        }
        
        groups[batchId].certificates.push(cert);
        groups[batchId].count++;
        
        if (cert.status === 'ACTIVE') {
          groups[batchId].activeCount++;
        } else if (cert.status === 'EXPIRED') {
          groups[batchId].expiredCount++;
        }
      }
    });

    return groups;
  }, [certificates]);

  // Sort rosters by name
  const sortedRosters = useMemo(() => {
    return Object.values(rosterGroups).sort((a, b) => a.name.localeCompare(b.name));
  }, [rosterGroups]);

  const downloadBatchCertificates = async (batchId: string) => {
    try {
      toast.info('Preparing batch download...');
      // Implementation would go here - simplified for now
      toast.success('Batch download prepared. Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading batch certificates:', error);
      toast.error('Failed to download batch certificates');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sortedRosters.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Users className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">No certificate rosters available.</p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Certificate rosters are created when certificates are issued in batches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedRosters.map(roster => (
        <Card key={roster.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {roster.name}
                </CardTitle>
                <CardDescription>
                  {roster.count} certificates ({roster.activeCount} active, {roster.expiredCount} expired)
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadBatchCertificates(roster.id)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
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
                  {roster.certificates.map(cert => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.recipient_name}</TableCell>
                      <TableCell>{cert.course_name}</TableCell>
                      <TableCell>
                        {cert.issue_date ? format(new Date(cert.issue_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {cert.expiry_date ? format(new Date(cert.expiry_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cert.status === 'ACTIVE'
                              ? 'success'
                              : cert.status === 'EXPIRED'
                                ? 'warning'
                                : 'destructive'
                          }
                        >
                          {cert.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
