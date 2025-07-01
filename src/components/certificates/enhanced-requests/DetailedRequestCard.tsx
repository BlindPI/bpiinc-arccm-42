
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  GraduationCap, 
  Calendar,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { EnhancedCertificateRequest } from '@/types/certificateValidation';

interface DetailedRequestCardProps {
  request: EnhancedCertificateRequest;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onViewDetails: () => void;
  canManage: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function DetailedRequestCard({
  request,
  isSelected,
  onSelect,
  onViewDetails,
  canManage,
  onApprove,
  onReject
}: DetailedRequestCardProps) {
  const canBeApproved = request.assessmentStatus !== 'FAIL';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          {canManage && canBeApproved && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}

          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{request.recipientName}</h3>
                <p className="text-sm text-gray-600">{request.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={request.assessmentStatus === 'PASS' ? 'default' : 'destructive'}>
                  {request.assessmentStatus}
                </Badge>
                <Badge variant="outline">
                  {request.status}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {request.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{request.phone}</span>
                </div>
              )}
              
              {request.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{request.company}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{request.locationName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{request.courseName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Issue: {new Date(request.issueDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Expires: {new Date(request.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Additional Info */}
            {(request.instructorName || request.firstAidLevel || request.cprLevel) && (
              <div className="flex flex-wrap gap-2">
                {request.instructorName && (
                  <Badge variant="outline">Instructor: {request.instructorName}</Badge>
                )}
                {request.firstAidLevel && (
                  <Badge variant="outline">First Aid: {request.firstAidLevel}</Badge>
                )}
                {request.cprLevel && (
                  <Badge variant="outline">CPR: {request.cprLevel}</Badge>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {request.validationErrors && request.validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {request.validationErrors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rejection Reason */}
            {request.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                <p className="text-xs text-red-600">{request.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {canManage && (
              <>
                {canBeApproved && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onApprove}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject('Manual rejection')}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
