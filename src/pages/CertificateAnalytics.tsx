
import React from 'react';
import CertificateAnalyticsDashboard from '@/components/analytics/CertificateAnalyticsDashboard';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CertificateAnalyticsPage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="m-6">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-center mb-4">
            Only administrators can view certificate analytics.
          </p>
          <Button onClick={() => navigate('/certifications')}>
            Return to Certificates
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CertificateAnalyticsDashboard />;
};

export default CertificateAnalyticsPage;
