
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupervisionHeader } from '@/components/supervision/dashboard/SupervisionHeader';
import { SupervisionNavigation } from '@/components/supervision/navigation/SupervisionNavigation';
import { UserSupervisionView } from "@/components/user-management/UserSupervisionView";
import { SupervisionManagement } from "@/components/user-management/SupervisionManagement";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, BarChart3, Shield, Clock } from 'lucide-react';
import { ActiveSupervisionRelationship } from "@/types/supabase-views";

export default function Supervision() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('relationships');

  // Fetch supervision relationships for metrics
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['supervision-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_supervision_relationships')
        .select('*');
      if (error) throw error;
      return data as unknown as ActiveSupervisionRelationship[];
    },
    enabled: !!user && !!profile
  });

  if (!user || profileLoading || relationshipsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate metrics
  const activeSupervisees = relationships?.filter(r => r.supervisor_id === user.id).length || 0;
  const activeSupervisors = relationships?.filter(r => r.supervisee_id === user.id).length || 0;
  const pendingRequests = relationships?.filter(r => r.status === 'REQUESTED').length || 0;
  const complianceRate = 88; // Mock compliance rate - would be calculated from actual data

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'relationships':
        return (
          <div className="space-y-6">
            <UserSupervisionView />
            <SupervisionManagement />
          </div>
        );
      case 'requests':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Supervision Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests > 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-lg font-medium mb-2">{pendingRequests} Pending Requests</h3>
                  <p className="text-muted-foreground">Review and respond to supervision requests</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                  <p>All supervision requests have been processed</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'compliance':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Supervision Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">Compliance Rate: {complianceRate}%</h3>
                <p className="text-muted-foreground">Your supervision relationships are compliant</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Supervision Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p>Comprehensive supervision analytics and reporting coming soon</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <SupervisionHeader
          activeSupervisees={activeSupervisees}
          activeSupervisors={activeSupervisors}
          pendingRequests={pendingRequests}
          complianceRate={complianceRate}
          userRole={profile?.role || ''}
        />

        {/* Navigation Cards */}
        <SupervisionNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeSupervisees={activeSupervisees}
          activeSupervisors={activeSupervisors}
          pendingRequests={pendingRequests}
          complianceRate={complianceRate}
        />

        {/* Content Area */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="animate-fade-in">
              {renderActiveContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
