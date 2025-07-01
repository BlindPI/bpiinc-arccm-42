
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';

interface ComplianceDocument {
  id: string;
  name: string;
  type: string;
  status: 'approved' | 'pending' | 'rejected';
  uploaded_at: string;
  file_url?: string;
}

interface ComplianceDocumentListProps {
  documents: ComplianceDocument[];
  onDocumentUpdate: () => void;
}

export function ComplianceDocumentList({ 
  documents, 
  onDocumentUpdate 
}: ComplianceDocumentListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No documents uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload your first compliance document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div 
          key={document.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getStatusIcon(document.status)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{document.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500 capitalize">{document.type}</p>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-xs text-gray-500">
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(document.status)}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              {document.file_url && (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
