
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  FileText, 
  Users, 
  Calendar,
  MapPin,
  Award,
  Eye,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Roster } from '@/types/roster';
import { Certificate } from '@/types/certificates';
import { BatchCertificateEmailForm } from '../BatchCertificateEmailForm';

interface RosterDetailsViewProps {
  roster: Roster;
  certificates: Certificate[];
  onBack: () => void;
  onGenerateReport: (rosterId: string) => void;
  onBulkDownload: (certificates: Certificate[]) => void;
}

export function RosterDetailsView({ 
  roster, 
  certificates, 
  onBack, 
  onGenerateReport,
  onBulkDownload 
}: RosterDetailsViewProps) {
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  const stats = {
    total: certificates.length,
    active: certificates.filter(c => c.status === 'ACTIVE').length,
    expired: certificates.filter(c => c.status === 'EXPIRED').length,
    revoked: certificates.filter(c => c.status === 'REVOKED').length,
    emailed: certificates.filter(c => c.is_batch_emailed || c.email_status === 'SENT').length
  };

  const handleSelectAll = () => {
    if (selectedCertificates.size === certificates.length) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(new Set(certificates.map(c => c.id)));
    }
  };

  const handleSelectCertificate = (certId: string) => {
    const newSelection = new Set(selectedCertificates);
    if (newSelection.has(certId)) {
      newSelection.delete(certId);
    } else {
      newSelection.add(certId);
    }
    setSelectedCertificates(newSelection);
  };

  const selectedCerts = certificates.filter(c => selectedCertificates.has(c.id));

  const handleBulkEmail = () => {
    if (selectedCerts.length === 0) {
      toast.error("No certificates selected for emailing");
      return;
    }
    
    // Check if certificates have associated email addresses
    const certificatesWithoutEmails = selectedCerts.filter(cert => 
      !cert.recipient_email
    );
    
    if (certificatesWithoutEmails.length > 0) {
      toast.error(`${certificatesWithoutEmails.length} certificates don't have associated email addresses`);
    }
    
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rosters
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{roster.name}</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(roster.created_at), 'PPP')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onGenerateReport(roster.id)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          {selectedCertificates.size > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={handleBulkEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Selected ({selectedCertificates.size})
              </Button>
              <Button 
                variant="outline"
                onClick={() => onBulkDownload(selectedCerts)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Selected ({selectedCertificates.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <div className="text-sm text-muted-foreground">Revoked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.emailed}</div>
            <div className="text-sm text-muted-foreground">Emailed</div>
          </CardContent>
        </Card>
      </div>

      {/* Roster Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Roster Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={roster.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {roster.status}
                </Badge>
              </div>
            </div>
            {roster.issue_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(roster.issue_date), 'PPP')}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Certificate Count</label>
              <div className="mt-1 flex items-center gap-2">
                <Award className="h-4 w-4" />
                {roster.certificate_count}
              </div>
            </div>
          </div>
          
          {roster.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1 text-sm">{roster.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Certificates ({certificates.length})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCertificates.size === certificates.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.size === certificates.length && certificates.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-medium">Recipient</th>
                    <th className="p-3 text-left font-medium">Course</th>
                    <th className="p-3 text-left font-medium">Issue Date</th>
                    <th className="p-3 text-left font-medium">Expiry Date</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Email Status</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.has(cert.id)}
                          onChange={() => handleSelectCertificate(cert.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 font-medium">{cert.recipient_name}</td>
                      <td className="p-3">{cert.course_name}</td>
                      <td className="p-3">{cert.issue_date}</td>
                      <td className="p-3">{cert.expiry_date}</td>
                      <td className="p-3">
                        <Badge 
                          variant={
                            cert.status === 'ACTIVE' ? 'default' : 
                            cert.status === 'EXPIRED' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {cert.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {(cert.is_batch_emailed || cert.email_status === 'SENT') ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            Not Sent
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {cert.certificate_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.certificate_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {cert.certificate_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.certificate_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <BatchCertificateEmailForm
            certificateIds={selectedCerts.map(cert => cert.id)}
            certificates={selectedCerts}
            onClose={handleCloseEmailDialog}
            batchName={roster.name}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
