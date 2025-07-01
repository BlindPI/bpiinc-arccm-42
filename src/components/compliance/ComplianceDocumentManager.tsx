
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Search, Filter, Download, Eye, Trash2, Upload } from 'lucide-react';

interface ComplianceDocument {
  id: string;
  user_id: string;
  user_name: string;
  metric_name: string;
  document_type: string;
  file_name?: string;
  file_url?: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

export function ComplianceDocumentManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['compliance-documents', searchTerm, statusFilter],
    queryFn: async () => {
      // Query user compliance records with document information
      let query = supabase
        .from('user_compliance_records')
        .select(`
          id,
          user_id,
          compliance_status,
          current_value,
          submitted_at,
          reviewed_at,
          review_notes,
          profiles!user_id (display_name),
          compliance_metrics!metric_id (name, category, measurement_type)
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('compliance_status', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching compliance documents:', error);
        return [];
      }

      // Transform the data to match our interface
      return (data || []).map((record: any) => ({
        id: record.id,
        user_id: record.user_id,
        user_name: record.profiles?.display_name || 'Unknown User',
        metric_name: record.compliance_metrics?.name || 'Unknown Metric',
        document_type: record.compliance_metrics?.measurement_type || 'document',
        file_name: record.current_value ? `${record.compliance_metrics?.name || 'document'}.pdf` : null,
        file_url: null, // Would need to be populated from storage
        status: record.compliance_status,
        submitted_at: record.submitted_at,
        reviewed_at: record.reviewed_at,
        reviewer_notes: record.review_notes
      })) as ComplianceDocument[];
    }
  });

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.metric_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load compliance documents</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Document Management</h3>
          <p className="text-sm text-muted-foreground">
            Review and manage user-submitted compliance documents
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Documents ({filteredDocuments.length})
          </CardTitle>
          <CardDescription>
            Manage user-submitted compliance documents and evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance documents found</p>
              <p className="text-sm">Documents will appear here when users submit compliance evidence</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Compliance Metric</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.user_name}
                    </TableCell>
                    <TableCell>{doc.metric_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="capitalize">{doc.document_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(doc.submitted_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {doc.file_url && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {documents?.filter(d => d.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {documents?.filter(d => d.status === 'approved').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {documents?.filter(d => d.status === 'rejected').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {documents?.filter(d => d.status === 'overdue').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
