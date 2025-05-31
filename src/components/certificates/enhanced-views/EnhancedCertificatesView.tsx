
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Award,
  Calendar,
  FileText,
  Eye,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { CertificateStatsCards } from './CertificateStatsCards';
import { EmailCertificateForm } from '../EmailCertificateForm';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function EnhancedCertificatesView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [emailDialogCert, setEmailDialogCert] = useState<Certificate | null>(null);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['enhanced-certificates', isAdmin, statusFilter, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select(`
          *,
          location:location_id(name, city, state_province, email, phone, website)
        `);

      if (!isAdmin && profile?.id) {
        query = query.eq('user_id', profile.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!profile
  });

  const filteredCertificates = certificates?.filter(cert => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      cert.recipient_name?.toLowerCase().includes(searchLower) ||
      cert.course_name?.toLowerCase().includes(searchLower) ||
      cert.verification_code?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSelectCertificate = (certId: string, selected: boolean) => {
    const newSelection = new Set(selectedCertificates);
    if (selected) {
      newSelection.add(certId);
    } else {
      newSelection.delete(certId);
    }
    setSelectedCertificates(newSelection);
  };

  const handleBulkEmail = () => {
    console.log('Bulk email certificates:', Array.from(selectedCertificates));
    toast.info('Bulk email functionality coming soon');
  };

  const handleExport = () => {
    console.log('Export certificates');
    toast.info('Export functionality coming soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'REVOKED' })
        .eq('id', certificateId);

      if (error) throw error;
      
      toast.success('Certificate revoked successfully');
      // Refetch certificates
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <CertificateStatsCards certificates={certificates || []} />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              {['ACTIVE', 'EXPIRED', 'REVOKED'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {selectedCertificates.size > 0 && (
                <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email ({selectedCertificates.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading certificates...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No certificates found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((certificate) => (
                <Card key={certificate.id} className="border rounded-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCertificates.has(certificate.id)}
                            onChange={(e) => handleSelectCertificate(certificate.id, e.target.checked)}
                            className="rounded"
                          />
                          <Award className="h-5 w-5 text-primary" />
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{certificate.recipient_name}</span>
                            {getStatusBadge(certificate.status)}
                          </div>
                        </div>
                        
                        {/* Course and Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Course:</span>
                            <div className="font-medium">{certificate.course_name}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Verification Code:</span>
                            <div className="font-mono font-medium">{certificate.verification_code}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Issue Date:</span>
                            <div className="font-medium">{format(new Date(certificate.issue_date), 'MMM dd, yyyy')}</div>
                          </div>
                        </div>
                        
                        {/* Additional Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Expiry Date:</span>
                            <div className="font-medium">{format(new Date(certificate.expiry_date), 'MMM dd, yyyy')}</div>
                          </div>
                          
                          {certificate.location && (
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <div className="font-medium">{certificate.location.name}</div>
                              {certificate.location.city && (
                                <div className="text-xs text-gray-400">
                                  {certificate.location.city}, {certificate.location.state_province}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {certificate.batch_name && (
                            <div>
                              <span className="text-gray-500">Batch:</span>
                              <div className="font-medium">{certificate.batch_name}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Email Status */}
                        {certificate.email_status && (
                          <div className="flex items-center gap-2 text-sm">
                            {certificate.email_status === 'SENT' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span>Email Status: {certificate.email_status}</span>
                            {certificate.last_emailed_at && (
                              <span className="text-gray-500">
                                (Last sent: {format(new Date(certificate.last_emailed_at), 'MMM dd, yyyy')})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {certificate.certificate_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(certificate.certificate_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {certificate.recipient_email && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEmailDialogCert(certificate)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        )}
                        
                        {isAdmin && certificate.status === 'ACTIVE' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRevokeCertificate(certificate.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      {emailDialogCert && (
        <Dialog open={!!emailDialogCert} onOpenChange={() => setEmailDialogCert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Certificate</DialogTitle>
            </DialogHeader>
            <EmailCertificateForm
              certificate={emailDialogCert}
              onClose={() => setEmailDialogCert(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
