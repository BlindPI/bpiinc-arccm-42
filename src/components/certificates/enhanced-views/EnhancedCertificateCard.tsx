
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Award, 
  Calendar, 
  Mail, 
  Eye, 
  Download,
  AlertTriangle 
} from 'lucide-react';
import { Certificate } from '@/types/certificates';
import { format } from 'date-fns';

interface EnhancedCertificateCardProps {
  certificate: Certificate;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  canManage: boolean;
}

export function EnhancedCertificateCard({
  certificate,
  isSelected,
  onSelect,
  canManage
}: EnhancedCertificateCardProps) {
  const isExpired = new Date(certificate.expiry_date) < new Date();
  
  const getStatusBadge = () => {
    switch (certificate.status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      case 'REVOKED':
        return <Badge variant="secondary">Revoked</Badge>;
      default:
        return <Badge variant="outline">{certificate.status}</Badge>;
    }
  };

  return (
    <Card className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{certificate.recipient_name}</span>
                  {getStatusBadge()}
                  {isExpired && certificate.status === 'ACTIVE' && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>{certificate.course_name}</strong>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Issued:</span>
                    <span>{format(new Date(certificate.issue_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Expires:</span>
                    <span>{format(new Date(certificate.expiry_date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Verification Code: {certificate.verification_code}
                </div>
                
                {certificate.batch_name && (
                  <Badge variant="outline" className="text-xs">
                    Batch: {certificate.batch_name}
                  </Badge>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {certificate.certificate_url && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                {canManage && (
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
