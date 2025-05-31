
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  Calendar, 
  Eye,
  RotateCcw,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { CertificateRequest } from '@/types/supabase-schema';
import { format } from 'date-fns';

interface EnhancedArchivedCardProps {
  request: CertificateRequest;
  canManage: boolean;
}

export function EnhancedArchivedCard({ request, canManage }: EnhancedArchivedCardProps) {
  const getStatusBadge = () => {
    switch (request.status) {
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      case 'ARCHIVE_FAILED':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Archive Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{request.status}</Badge>;
    }
  };

  const handleRestore = () => {
    console.log('Restore request:', request.id);
    // TODO: Implement restore functionality
  };

  return (
    <Card className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">{request.recipient_name}</span>
              {getStatusBadge()}
            </div>
            
            {/* Course and Details */}
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">{request.course_name}</span>
              </div>
              
              {request.email && (
                <div className="text-sm text-gray-600">
                  Email: {request.email}
                </div>
              )}
              
              {request.rejection_reason && (
                <div className="text-sm">
                  <span className="text-red-600 font-medium">Rejection Reason:</span>
                  <div className="text-gray-600 mt-1">{request.rejection_reason}</div>
                </div>
              )}
            </div>
            
            {/* Dates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Issue Date:</span>
                <span>{format(new Date(request.issue_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Expiry Date:</span>
                <span>{format(new Date(request.expiry_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Archived:</span>
                <span>{format(new Date(request.updated_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            
            {/* Assessment Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Assessment Status:</span>
              <Badge 
                variant={request.assessment_status === 'PASS' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {request.assessment_status}
              </Badge>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            {canManage && request.status === 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={handleRestore}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
