
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Award, 
  Calendar, 
  MapPin, 
  Download, 
  Mail, 
  Eye, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Certificate } from '@/types/certificates';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmailDeliveryStatus } from '../EmailDeliveryStatus';

interface EnhancedCertificateCardProps {
  certificate: Certificate;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onView?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  onRevoke?: () => void;
  showActions?: boolean;
  locationName?: string;
}

export const EnhancedCertificateCard: React.FC<EnhancedCertificateCardProps> = ({
  certificate,
  isSelected,
  onSelect,
  onView,
  onDownload,
  onEmail,
  onRevoke,
  showActions = true,
  locationName
}) => {
  const getStatusBadge = () => {
    switch (certificate.status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'REVOKED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{certificate.status}</Badge>
        );
    }
  };

  const getEmailStatusIndicator = () => {
    return (
      <EmailDeliveryStatus
        certificateId={certificate.id}
        deliveryStatus={certificate.delivery_status}
        lastDeliveryAttempt={certificate.last_delivery_attempt}
        deliveryAttempts={certificate.delivery_attempts}
        bounceReason={certificate.bounce_reason}
        emailStatus={certificate.email_status}
        isBatchEmailed={certificate.is_batch_emailed}
        lastEmailedAt={certificate.last_emailed_at}
        size="sm"
        showRetryButton={true}
      />
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {showActions && (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
            )}
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-gray-900">
                  {certificate.recipient_name}
                </h3>
                {getStatusBadge()}
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">{certificate.course_name}</span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}
                {onEmail && (
                  <DropdownMenuItem onClick={onEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Certificate
                  </DropdownMenuItem>
                )}
                {onRevoke && certificate.status === 'ACTIVE' && (
                  <DropdownMenuItem onClick={onRevoke} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Revoke
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Issue Date</span>
            </div>
            <div className="font-medium">
              {format(new Date(certificate.issue_date), 'MMM dd, yyyy')}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Expiry Date</span>
            </div>
            <div className="font-medium">
              {format(new Date(certificate.expiry_date), 'MMM dd, yyyy')}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
            </div>
            <div className="font-medium">
              {locationName || 'No Location'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Verification Code</div>
            <div className="font-mono text-sm font-medium">
              {certificate.verification_code}
            </div>
          </div>
          
          <div className="text-right">
            {getEmailStatusIndicator()}
            {certificate.last_emailed_at && (
              <div className="text-xs text-gray-400 mt-1">
                Last sent: {format(new Date(certificate.last_emailed_at), 'MMM dd')}
              </div>
            )}
          </div>
        </div>
        
        {certificate.batch_name && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              Batch: {certificate.batch_name}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
