
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Calendar, 
  MapPin,
  Eye, 
  Award,
  FileText,
  Mail
} from 'lucide-react';
import { RosterWithRelations } from '@/types/roster';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchCertificateEmailForm } from '../BatchCertificateEmailForm';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { RosterCountIndicator } from '@/components/rosters/RosterCountIndicator';

interface EnhancedRosterCardProps {
  roster: RosterWithRelations;
  canManage: boolean;
}

export function EnhancedRosterCard({ roster, canManage }: EnhancedRosterCardProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Get certificates for this roster
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['roster-certificates', roster.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', roster.id);
      
      if (error) throw error;
      return (data || []) as Certificate[];
    }
  });

  const handleEmailClick = () => {
    if (!certificates || certificates.length === 0) {
      toast.warning('No certificates found for this roster');
      return;
    }
    
    const certsWithoutEmail = certificates.filter(cert => !cert.recipient_email);
    const certsWithoutUrl = certificates.filter(cert => !cert.certificate_url);
    
    if (certsWithoutEmail.length > 0 || certsWithoutUrl.length > 0) {
      // Still allow opening the dialog, but show warnings there
    }
    
    setIsEmailDialogOpen(true);
  };

  const getStatusBadge = () => {
    switch (roster.status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{roster.status}</Badge>;
    }
  };

  return (
    <>
      <Card className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold text-lg">{roster.name}</span>
                {getStatusBadge()}
              </div>
              
              {/* Description */}
              {roster.description && (
                <p className="text-sm text-gray-600">{roster.description}</p>
              )}
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {/* Course */}
                {roster.course && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Course:</span>
                      <div className="font-medium">{roster.course.name}</div>
                    </div>
                  </div>
                )}
                
                {/* Location */}
                {roster.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <div className="font-medium">{roster.location.name}</div>
                      {roster.location.city && (
                        <div className="text-xs text-gray-400">
                          {roster.location.city}, {roster.location.state_province}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Certificate Count with Validation */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Certificates:</span>
                    <div className="flex items-center gap-2">
                      <RosterCountIndicator 
                        rosterId={roster.id}
                        storedCount={roster.certificate_count}
                        showFixButton={canManage}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dates */}
              <div className="flex gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {format(new Date(roster.created_at), 'MMM dd, yyyy')}
                </div>
                {roster.issue_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Issue Date: {format(new Date(roster.issue_date), 'MMM dd, yyyy')}
                  </div>
                )}
              </div>
              
              {/* Creator */}
              {roster.creator && (
                <div className="text-xs text-gray-500">
                  Created by: {roster.creator.display_name || roster.creator.email}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2 ml-4">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              
              {canManage && roster.certificate_count > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEmailClick}
                  disabled={certificatesLoading}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email All
                  <Badge variant="secondary">{roster.certificate_count}</Badge>
                </Button>
              )}
              
              {canManage && (
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Generate Report
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Roster Certificates</DialogTitle>
          </DialogHeader>
          {certificates && (
            <BatchCertificateEmailForm
              certificateIds={certificates.map(cert => cert.id)}
              certificates={certificates}
              onClose={() => setIsEmailDialogOpen(false)}
              batchName={`Roster ${roster.name}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
