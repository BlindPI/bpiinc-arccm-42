import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search,
  Download,
  Eye,
  Upload,
  User,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { ComplianceService, ComplianceDocument } from '@/services/compliance/complianceService';

interface TeamDocument extends ComplianceDocument {
  member_name: string;
  member_email: string;
  team_name: string;
  metric_name: string;
  metric_category: string;
}

export function TeamDocumentManager() {
  const { state } = useComplianceDashboard();
  const { teamMemberCompliance } = state.data;

  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // Load all team member documents
  useEffect(() => {
    const loadTeamDocuments = async () => {
      try {
        setLoading(true);
        const allDocuments: TeamDocument[] = [];

        // Fetch documents for each team member
        for (const member of teamMemberCompliance) {
          try {
            const memberDocuments = await ComplianceService.getUserComplianceDocuments(member.user_id);
            
            const enrichedDocuments = memberDocuments.map(doc => ({
              ...doc,
              member_name: member.member_name,
              member_email: member.member_email,
              team_name: member.team_name,
              metric_name: doc.compliance_metrics?.name || 'Unknown Requirement',
              metric_category: doc.compliance_metrics?.category || 'general'
            }));

            allDocuments.push(...enrichedDocuments);
          } catch (error) {
            console.error(`Failed to load documents for member ${member.user_id}:`, error);
          }
        }

        setDocuments(allDocuments);
      } catch (error) {
        console.error('Failed to load team documents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamMemberCompliance.length > 0) {
      loadTeamDocuments();
    } else {
      setLoading(false);
    }
  }, [teamMemberCompliance]);

  // Get unique members for filtering
  const uniqueMembers = Array.from(new Set(teamMemberCompliance.map(member => member.member_name)));

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.verification_status === statusFilter;
    const matchesMember = memberFilter === 'all' || doc.member_name === memberFilter;
    
    return matchesSearch && matchesStatus && matchesMember;
  });

  // Sort documents by verification status and upload date
  const sortedDocuments = filteredDocuments.sort((a, b) => {
    // Priority order: pending > rejected > expired > approved
    const statusOrder = { pending: 4, rejected: 3, expired: 2, approved: 1 };
    const statusDiff = statusOrder[b.verification_status] - statusOrder[a.verification_status];
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then by upload date (newest first)
    return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    try {
      return new Date(expiryDate) < new Date();
    } catch {
      return false;
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

  const verifyDocument = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await ComplianceService.verifyComplianceDocument(documentId, status, notes);
      
      // Refresh documents
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, verification_status: status, verification_notes: notes }
            : doc
        )
      );
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  };

  // Calculate summary stats from real data
  const documentStats = {
    total: documents.length,
    approved: documents.filter(d => d.verification_status === 'approved').length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length,
    expired: documents.filter(d => d.expiry_date && isExpired(d.expiry_date)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading team documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <div className="text-xs text-gray-500">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{documentStats.approved}</div>
            <div className="text-xs text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{documentStats.pending}</div>
            <div className="text-xs text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{documentStats.rejected}</div>
            <div className="text-xs text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{documentStats.expired}</div>
            <div className="text-xs text-gray-500">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Team Document Management
              <Badge variant="outline">{filteredDocuments.length} documents</Badge>
            </CardTitle>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents, members, or requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              {uniqueMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {sortedDocuments.length > 0 ? (
            <div className="space-y-4">
              {sortedDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  className={`p-4 border rounded-lg ${
                    doc.expiry_date && isExpired(doc.expiry_date)
                      ? 'bg-orange-50 border-orange-200' 
                      : doc.verification_status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant="outline"
                          className={getStatusColor(doc.verification_status)}
                        >
                          {getStatusIcon(doc.verification_status)}
                          {doc.verification_status}
                        </Badge>
                        
                        {doc.expiry_date && isExpired(doc.expiry_date) && (
                          <Badge variant="destructive">
                            Expired
                          </Badge>
                        )}
                        
                        <Badge variant="outline">{doc.metric_category}</Badge>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-1">
                        {doc.file_name}
                      </h4>

                      <p className="text-sm text-gray-600 mb-2">
                        {doc.metric_name}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.member_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.team_name}
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

                      <div className="text-xs text-gray-500">
                        Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB • Type: {doc.file_type}
                      </div>

                      {doc.verification_notes && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <strong>Notes:</strong> {doc.verification_notes}
                        </div>
                      )}

                      {doc.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {doc.rejection_reason}
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
                      
                      {doc.verification_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => verifyDocument(doc.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => verifyDocument(doc.id, 'rejected', 'Document rejected by team manager')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {documents.length === 0 ? (
                <>
                  <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No documents found</p>
                  <p className="text-sm">No compliance documents have been uploaded by your team members yet.</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No documents match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts for pending/expired documents */}
      {documentStats.pending > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {documentStats.pending} document(s) are pending verification and require your review.
          </AlertDescription>
        </Alert>
      )}

      {documentStats.expired > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {documentStats.expired} document(s) have expired and need to be renewed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}