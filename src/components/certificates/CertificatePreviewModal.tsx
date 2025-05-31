
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCertificateThumbnail } from '@/hooks/useCertificateThumbnail';
import { toast } from 'sonner';

interface CertificatePreviewModalProps {
  certificate: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificatePreviewModal({ 
  certificate, 
  isOpen, 
  onClose 
}: CertificatePreviewModalProps) {
  const { thumbnailUrl, isLoading, error, regenerate } = useCertificateThumbnail(
    isOpen ? certificate?.id : undefined
  );

  const handleDownloadPDF = () => {
    if (!certificate?.certificate_url) {
      toast.error('Certificate PDF not available');
      return;
    }

    // Open the certificate URL directly
    window.open(certificate.certificate_url, '_blank');
  };

  if (!certificate) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Certificate Preview
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate Preview */}
          <div className="lg:col-span-2">
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {isLoading ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-gray-600">Generating preview...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-gray-600 mb-3">Preview generation failed</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={regenerate}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : thumbnailUrl ? (
                <div className="aspect-[4/3]">
                  <img
                    src={thumbnailUrl}
                    alt="Certificate Preview"
                    className="w-full h-full object-contain"
                    onError={() => toast.error('Failed to load thumbnail')}
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Preview will load shortly...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleDownloadPDF}
                className="flex-1"
                disabled={!certificate.certificate_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full PDF
              </Button>
              {!thumbnailUrl && !isLoading && (
                <Button 
                  variant="outline" 
                  onClick={regenerate}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Certificate Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Recipient
                    </label>
                    <p className="text-sm font-medium">{certificate.recipient_name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Course
                    </label>
                    <p className="text-sm font-medium">{certificate.course_name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Instructor
                    </label>
                    <p className="text-sm">{certificate.instructor_name || 'Not specified'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Issue Date
                      </label>
                      <p className="text-sm">{formatDate(certificate.issue_date)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Expiry Date
                      </label>
                      <p className="text-sm">{formatDate(certificate.expiry_date)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Verification Code
                    </label>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {certificate.verification_code}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge 
                        variant={certificate.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={
                          certificate.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : ''
                        }
                      >
                        {certificate.status}
                      </Badge>
                    </div>
                  </div>

                  {certificate.batch_name && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Batch
                      </label>
                      <p className="text-sm">{certificate.batch_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
