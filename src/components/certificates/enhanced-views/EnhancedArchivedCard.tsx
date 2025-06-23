
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Archive,
  Calendar,
  Eye,
  RotateCcw,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Building,
  MapPin,
  StickyNote,
  GraduationCap,
  Package
} from 'lucide-react';
import { CertificateRequest } from '@/types/supabase-schema';
import { format } from 'date-fns';

interface EnhancedArchivedCardProps {
  request: CertificateRequest;
  canManage: boolean;
}

export function EnhancedArchivedCard({ request, canManage }: EnhancedArchivedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const extendedRequest = request as CertificateRequest & { notes?: string | null };
  
  const hasAdditionalData = extendedRequest.notes || request.phone || request.company ||
                           request.city || request.province || request.postal_code ||
                           request.instructor_name || request.instructor_level ||
                           request.cpr_level || request.first_aid_level;

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
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">{request.recipient_name}</span>
              {getStatusBadge()}
              {hasAdditionalData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
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
          
          {/* Basic Information */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{request.course_name}</span>
            </div>
            
            {request.email && (
              <div className="text-sm text-gray-600">
                Email: {request.email}
              </div>
            )}
            
            {/* Assessment Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Assessment Status:</span>
              <Badge
                variant={request.assessment_status === 'PASS' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {request.assessment_status || 'PASS'}
              </Badge>
            </div>

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
          
          {/* Expandable Additional Details */}
          {hasAdditionalData && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="space-y-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Contact Information */}
                  {(request.phone || request.company) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Contact Information
                      </h4>
                      {request.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{request.phone}</span>
                        </div>
                      )}
                      {request.company && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span>{request.company}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Address Information */}
                  {(request.city || request.province || request.postal_code) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Address
                      </h4>
                      <div className="text-sm text-gray-600">
                        {[request.city, request.province, request.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Instructor Information */}
                  {(request.instructor_name || request.instructor_level) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        Instructor
                      </h4>
                      {request.instructor_name && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Name:</span> {request.instructor_name}
                        </div>
                      )}
                      {request.instructor_level && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Level:</span> {request.instructor_level}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Certification Details */}
                  {(request.cpr_level || request.first_aid_level) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Certification Details
                      </h4>
                      {request.cpr_level && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">CPR Level:</span> {request.cpr_level}
                        </div>
                      )}
                      {request.first_aid_level && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">First Aid Level:</span> {request.first_aid_level}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Notes Section - Always full width if present */}
                {extendedRequest.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{extendedRequest.notes}</p>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
