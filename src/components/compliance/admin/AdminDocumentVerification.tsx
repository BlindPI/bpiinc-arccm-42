import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  User,
  Calendar,
  Search,
  MessageSquare
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { ComplianceService } from '@/services/compliance/complianceService';

export function AdminDocumentVerification() {
  const { state, refreshData } = useComplianceDashboard();
  const { documentsForVerification } = state.data;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Filter documents based on search
  const filteredDocuments = documentsForVerification.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.compliance_metrics?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc as any).user_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc as any).user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc as any).uploaded_by_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc as any).uploaded_by_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by upload date (oldest first for verification queue)
  const sortedDocuments = filteredDocuments.sort((a, b) => 
    new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime()
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await ComplianceService.getDocumentDownloadUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleVerification = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessing(documentId);
      
      const notes = status === 'approved' ? verificationNotes : undefined;
      const reason = status === 'rejected' ? rejectionReason : undefined;
      
      await ComplianceService.verifyComplianceDocument(documentId, status, notes, reason);
      
      // Clear form data
      setVerificationNotes('');
      setRejectionReason('');
      setSelectedDocument(null);
      
      // Refresh data
      await refreshData();
      
    } catch (error) {
      console.error('Failed to verify document:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getDaysWaiting = (uploadDate: string) => {
    const days = Math.floor((new Date().getTime() - new Date(uploadDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    try {
      return new Date(expiryDate) < new Date();
    } catch {
      return false;
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    try {
      const expiry = new Date(expiryDate);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return expiry <= thirtyDaysFromNow && expiry >= new Date();
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Document Verification Queue
            <Badge variant="destructive">{documentsForVerification.length}</Badge>
          </CardTitle>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents, users, or requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sortedDocuments.length > 0 ? (
          <div className="space-y-4">
            {sortedDocuments.map((doc) => {
              const complianceUser = (doc as any).user_profile; // Who the document is FOR
              const uploadedBy = (doc as any).uploaded_by_profile; // Who uploaded it
              const daysWaiting = getDaysWaiting(doc.upload_date);
              const isUrgent = daysWaiting > 7;
              
              return (
                <div 
                  key={doc.id}
                  className={`p-4 border rounded-lg ${
                    isUrgent 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Review
                        </Badge>
                        
                        {isUrgent && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent ({daysWaiting} days waiting)
                          </Badge>
                        )}
                        
                        {doc.expiry_date && isExpired(doc.expiry_date) && (
                          <Badge variant="destructive">
                            Document Expired
                          </Badge>
                        )}
                        
                        <Badge variant="outline">
                          {doc.compliance_metrics?.category || 'General'}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-1">
                        {doc.file_name}
                      </h4>

                      <p className="text-sm text-gray-600 mb-2">
                        {doc.compliance_metrics?.name || 'Unknown Requirement'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <strong>For:</strong> {complianceUser?.display_name || 'Unknown User'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {complianceUser?.email || 'No email'}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <User className="h-3 w-3" />
                          <strong>Uploaded by:</strong> {uploadedBy ? `${uploadedBy.display_name} (${uploadedBy.role})` : 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Uploaded {formatDate(doc.upload_date)}
                        </span>
                        {doc.expiry_date && (
                          <span className={`flex items-center gap-1 ${
                            isExpired(doc.expiry_date) ? 'text-red-600 font-medium' : ''
                          }`}>
                            <Calendar className="h-3 w-3" />
                            Expires {formatDate(doc.expiry_date)}
                          </span>
                        )}
                     </div>

                      <div className="bg-blue-50 p-3 rounded mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-blue-700 font-medium">Document Information</div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Document for:</span>
                            <span className="font-medium">{complianceUser?.display_name || 'Unknown User'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Uploaded by:</span>
                            <span className="font-medium">
                              {uploadedBy ? `${uploadedBy.display_name} (${uploadedBy.role})` : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Upload timestamp:</span>
                            <span className="font-medium">{new Date(doc.upload_date).toLocaleString()}</span>
                          </div>
                          {doc.expiry_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expires:</span>
                              <span className={`font-medium ${
                                isExpired(doc.expiry_date) ? 'text-red-600' : 
                                isExpiringSoon(doc.expiry_date) ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {new Date(doc.expiry_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {doc.verified_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{doc.verification_status === 'approved' ? 'Approved' : 'Verified'} timestamp:</span>
                              <span className="font-medium text-green-600">
                                {new Date(doc.verified_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {(doc as any).verified_by_profile && doc.verified_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{doc.verification_status === 'approved' ? 'Approved' : 'Verified'} by:</span>
                              <span className="font-medium text-green-600">
                                {(doc as any).verified_by_profile.display_name} ({(doc as any).verified_by_profile.role})
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${doc.verification_status === 'pending' ? 'text-yellow-600' : doc.verification_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                              {doc.verification_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB • Type: {doc.file_type?.toUpperCase()}
                      </div>

                      {/* Verification Form */}
                      {selectedDocument === doc.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Verification Notes (Optional)</label>
                            <Textarea
                              placeholder="Add any notes about this document..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rejection Reason (If Rejecting)</label>
                            <Textarea
                              placeholder="Explain why this document is being rejected..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleVerification(doc.id, 'approved')}
                              disabled={processing === doc.id}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {processing === doc.id ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleVerification(doc.id, 'rejected')}
                              disabled={processing === doc.id || !rejectionReason.trim()}
                              className="flex-1"
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {processing === doc.id ? 'Processing...' : 'Reject'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedDocument(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      
                      {selectedDocument !== doc.id && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDocument(doc.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {documentsForVerification.length === 0 ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No documents are currently pending verification.</p>
              </>
            ) : (
              <>
                <Search className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No documents match your search</p>
                <p className="text-sm">Try adjusting your search criteria.</p>
              </>
            )}
          </div>
        )}

        {/* Summary Alert */}
        {documentsForVerification.length > 0 && (
          <Alert className="mt-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {documentsForVerification.length} document(s) are waiting for verification. 
              {sortedDocuments.filter(d => getDaysWaiting(d.upload_date) > 7).length > 0 && 
                ` ${sortedDocuments.filter(d => getDaysWaiting(d.upload_date) > 7).length} are urgent (over 7 days old).`
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}