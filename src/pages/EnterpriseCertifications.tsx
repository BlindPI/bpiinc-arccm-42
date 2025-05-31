
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificateNavigationCards } from '@/components/certificates/navigation/CertificateNavigationCards';
import { CertificateMetricsHeader } from '@/components/certificates/dashboard/CertificateMetricsHeader';
import { EnhancedPendingRequestsView } from '@/components/certificates/enhanced-requests/EnhancedPendingRequestsView';
import { EnhancedCertificatesView } from '@/components/certificates/enhanced-views/EnhancedCertificatesView';
import { EnhancedRostersView } from '@/components/certificates/enhanced-views/EnhancedRostersView';
import { EnhancedArchivedView } from '@/components/certificates/enhanced-views/EnhancedArchivedView';
import { BatchCertificateUpload } from '@/components/certificates/BatchCertificateUpload';
import { CertificateForm } from '@/components/certificates/CertificateForm';
import { CertificateRecoveryDashboard } from '@/components/certificates/CertificateRecoveryDashboard';

export default function EnterpriseCertifications() {
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState('certificates');
  
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Fetch metrics data
  const { data: metrics } = useQuery({
    queryKey: ['certificate-metrics', canManageRequests, profile?.id],
    queryFn: async () => {
      const [certificatesQuery, requestsQuery] = await Promise.all([
        supabase
          .from('certificates')
          .select('id, status')
          .then(({ data }) => data || []),
        supabase
          .from('certificate_requests')
          .select('id, status')
          .then(({ data }) => data || [])
      ]);

      const totalCertificates = certificatesQuery.length;
      const pendingRequests = requestsQuery.filter(r => r.status === 'PENDING').length;
      const approvedRequests = requestsQuery.filter(r => r.status === 'APPROVED').length;
      const archivedRequests = requestsQuery.filter(r => r.status === 'ARCHIVED').length;
      
      const completionRate = requestsQuery.length > 0 
        ? Math.round((approvedRequests / requestsQuery.length) * 100) 
        : 0;
      
      const recentActivity = pendingRequests + (approvedRequests * 0.1); // Mock recent activity

      return {
        totalCertificates,
        pendingRequests,
        completionRate,
        recentActivity: Math.round(recentActivity),
        archivedRequests
      };
    },
    enabled: !!profile
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'batch':
        return <BatchCertificateUpload />;
      case 'requests':
        return <EnhancedPendingRequestsView />;
      case 'certificates':
        return <EnhancedCertificatesView />;
      case 'rosters':
        return <EnhancedRostersView />;
      case 'archived':
        return <EnhancedArchivedView />;
      case 'recovery':
        return canManageRequests ? <CertificateRecoveryDashboard /> : null;
      case 'new':
        return canManageRequests ? <CertificateForm /> : null;
      default:
        return <EnhancedCertificatesView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Metrics */}
        <CertificateMetricsHeader 
          canManageRequests={canManageRequests}
          metrics={metrics}
        />

        {/* Navigation Cards */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Certificate Operations
            </h2>
            <CertificateNavigationCards
              activeTab={activeTab}
              onTabChange={setActiveTab}
              canManageRequests={canManageRequests}
              stats={metrics}
            />
          </div>
        </div>

        {/* Active Tab Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="min-h-[60vh]">
              {renderTabContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
