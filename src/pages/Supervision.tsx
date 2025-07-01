
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
import { Loader2, Users, BarChart3, Shield, Clock, CheckCircle, UserCheck } from 'lucide-react';
import { ActiveSupervisionRelationship } from "@/types/supabase-views";

export default function Supervision() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('relationships');

  // Fetch real supervision relationships and metrics
  const { data: supervisionData, isLoading: supervisionLoading } = useQuery({
    queryKey: ['supervision-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      console.log('Fetching supervision data...');

      // Get supervision relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('active_supervision_relationships')
        .select('*');

      if (relationshipsError) {
        console.error('Error fetching supervision relationships:', relationshipsError);
        throw relationshipsError;
      }

      // Calculate metrics
      const activeSupervisees = relationships?.filter(r => r.supervisor_id === user.id && r.status === 'ACTIVE').length || 0;
      const activeSupervisors = relationships?.filter(r => r.supervisee_id === user.id && r.status === 'ACTIVE').length || 0;
      const pendingRequests = relationships?.filter(r => 
        (r.supervisor_id === user.id || r.supervisee_id === user.id) && r.status === 'REQUESTED'
      ).length || 0;

      // Calculate compliance rate (simplified - based on active relationships)
      const totalRelationships = relationships?.filter(r => 
        r.supervisor_id === user.id || r.supervisee_id === user.id
      ).length || 0;
      const activeRelationships = relationships?.filter(r => 
        (r.supervisor_id === user.id || r.supervisee_id === user.id) && r.status === 'ACTIVE'
      ).length || 0;
      const complianceRate = totalRelationships > 0 ? Math.round((activeRelationships / totalRelationships) * 100) : 100;

      console.log('Supervision metrics:', {
        supervisees: activeSupervisees,
        supervisors: activeSupervisors,
        pending: pendingRequests,
        compliance: complianceRate,
        total: totalRelationships
      });

      return {
        relationships: relationships as unknown as ActiveSupervisionRelationship[],
        activeSupervisees,
        activeSupervisors,
        pendingRequests,
        complianceRate
      };
    },
    enabled: !!user?.id && !!profile
  });

  if (!user || profileLoading || supervisionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateRelationship = () => {
    setActiveTab('relationships');
    // Additional logic for creating relationships would go here
  };

  const handleExportData = () => {
    console.log('Exporting supervision data...');
    // Export functionality would be implemented here
  };

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
              <div className="space-y-4">
                {supervisionData?.pendingRequests && supervisionData.pendingRequests > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium">Pending Requests</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{supervisionData.pendingRequests}</p>
                        <p className="text-sm text-muted-foreground">Awaiting your response</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                    <p>All supervision requests have been processed</p>
                  </div>
                )}
              </div>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Compliance Rate</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{supervisionData?.complianceRate || 0}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Active Relationships</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {(supervisionData?.activeSupervisees || 0) + (supervisionData?.activeSupervisors || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Role Compliance</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {supervisionData?.complianceRate && supervisionData.complianceRate >= 80 ? 'Good' : 'Review'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Supervisees</p>
                        <p className="text-2xl font-bold">{supervisionData?.activeSupervisees || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Supervisors</p>
                        <p className="text-2xl font-bold">{supervisionData?.activeSupervisors || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">{supervisionData?.pendingRequests || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Compliance</p>
                        <p className="text-2xl font-bold">{supervisionData?.complianceRate || 0}%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Detailed supervision analytics and performance tracking is being developed.
                </p>
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
        {/* Header with real data */}
        <SupervisionHeader
          activeSupervisees={supervisionData?.activeSupervisees || 0}
          activeSupervisors={supervisionData?.activeSupervisors || 0}
          pendingRequests={supervisionData?.pendingRequests || 0}
          complianceRate={supervisionData?.complianceRate || 0}
          userRole={profile?.role || ''}
          onCreateRelationship={handleCreateRelationship}
          onExportData={handleExportData}
        />

        {/* Navigation Cards with real data */}
        <SupervisionNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeSupervisees={supervisionData?.activeSupervisees || 0}
          activeSupervisors={supervisionData?.activeSupervisors || 0}
          pendingRequests={supervisionData?.pendingRequests || 0}
          complianceRate={supervisionData?.complianceRate || 0}
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
