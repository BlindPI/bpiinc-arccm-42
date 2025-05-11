
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import CertificateAnalyticsDashboard from '@/components/analytics/CertificateAnalyticsDashboard';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

const CertificateAnalyticsPage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-12 bg-gray-200 rounded-md w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded-md w-1/4 mt-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="h-24 bg-gray-200 rounded-md"></div>
            <div className="h-24 bg-gray-200 rounded-md"></div>
            <div className="h-24 bg-gray-200 rounded-md"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-md mt-4"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card className="m-6 border-red-100 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <div className="bg-red-50 p-3 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Only administrators can view certificate analytics. Please contact your system administrator if you believe you should have access.
            </p>
            <Button onClick={() => navigate('/certifications')}>
              Return to Certificates
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <PageHeader
          icon={<BarChart className="h-7 w-7 text-primary" />}
          title="Certificate Analytics Dashboard"
          subtitle="Comprehensive insights into certification activities and trends"
          badge={{
            text: "Admin Only",
            variant: "success"
          }}
        />
        <CertificateAnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
};

export default CertificateAnalyticsPage;
