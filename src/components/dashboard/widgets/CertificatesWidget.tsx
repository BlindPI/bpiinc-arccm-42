
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, Eye, Calendar } from 'lucide-react';

interface CertificatesWidgetProps {
  userId: string;
}

export const CertificatesWidget: React.FC<CertificatesWidgetProps> = ({ userId }) => {
  // Mock certificates data
  const certificatesData = [
    {
      id: '1',
      name: 'CPR Certification',
      issueDate: '2024-03-15',
      expiryDate: '2026-03-15',
      status: 'valid',
      downloadUrl: '#'
    },
    {
      id: '2',
      name: 'First Aid Certification',
      issueDate: '2024-05-20',
      expiryDate: '2026-05-20',
      status: 'valid',
      downloadUrl: '#'
    },
    {
      id: '3',
      name: 'Basic Life Support',
      issueDate: '2023-08-10',
      expiryDate: '2025-08-10',
      status: 'expiring_soon',
      downloadUrl: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'expiring_soon': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'valid': return 'Valid';
      default: return status;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600" />
          My Certificates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certificatesData.map((certificate) => (
            <div key={certificate.id} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{certificate.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(certificate.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(certificate.status)}>
                  {formatStatus(certificate.status)}
                </Badge>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          ))}
          
          {certificatesData.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificates found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
