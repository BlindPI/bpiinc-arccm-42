
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar } from 'lucide-react';
import { useStudentDashboardData } from '@/hooks/dashboard/useStudentDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface CertificatesWidgetProps {
  userId: string;
}

export const CertificatesWidget: React.FC<CertificatesWidgetProps> = ({ 
  userId 
}) => {
  const { certificates, isLoading } = useStudentDashboardData(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoader message="Loading certificates..." />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'REVOKED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          My Certificates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {certificates.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No certificates found
          </p>
        ) : (
          certificates.map((certificate) => (
            <div key={certificate.id} className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{certificate.courseName}</h4>
                <Badge className={getStatusColor(certificate.status)}>
                  {certificate.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Issued: {certificate.issueDate}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires: {certificate.expiryDate}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
