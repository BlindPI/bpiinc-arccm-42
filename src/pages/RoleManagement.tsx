
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoleManagementHeader } from '@/components/role-management/dashboard/RoleManagementHeader';
import { ProgressionDashboard } from '@/components/role-management/progression/ProgressionDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function RoleManagement() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('progression');

  // Fetch real progression data
  const { data: progressionData, isLoading: progressionLoading } = useQuery({
    queryKey: ['role-progression-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      console.log('Fetching role progression data...');

      // Get progression history
      const { data: progressionHistory, error: historyError } = await supabase
        .from('progression_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error fetching progression history:', historyError);
        throw historyError;
      }

      // Get pending progression requests
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('progression_history')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('Error fetching pending requests:', pendingError);
        throw pendingError;
      }

      // Calculate compliance rate (simplified)
      const totalProgressions = progressionHistory?.length || 0;
      const approvedProgressions = progressionHistory?.filter(p => p.status === 'approved').length || 0;
      const complianceRate = totalProgressions > 0 ? Math.round((approvedProgressions / totalProgressions) * 100) : 100;

      // Get next eligible role (simplified logic)
      const currentRole = profile?.role || '';
      const roleHierarchy = {
        'IT': 'instructor_candidate',
        'instructor_candidate': 'instructor_provisional',
        'instructor_provisional': 'instructor_trainer',
        'instructor_trainer': 'instructor_trainer' // Top level
      };
      const nextEligibleRole = roleHierarchy[currentRole as keyof typeof roleHierarchy] || null;

      console.log('Role progression data:', {
        current: currentRole,
        next: nextEligibleRole,
        total: totalProgressions,
        pending: pendingRequests?.length || 0,
        compliance: complianceRate
      });

      return {
        currentRole,
        nextEligibleRole,
        totalProgression: totalProgressions,
        pendingRequests: pendingRequests?.length || 0,
        complianceRate,
        progressionHistory: progressionHistory || []
      };
    },
    enabled: !!user?.id && !!profile
  });

  if (!user || profileLoading || progressionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExportProgress = () => {
    console.log('Exporting progression data...');
    // Export functionality would be implemented here
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'progression':
        return <ProgressionDashboard userId={user.id} />;
      case 'requirements':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Role Requirements Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Current Role</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{progressionData?.currentRole || 'Unknown'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Next Role</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{progressionData?.nextEligibleRole || 'None'}</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Detailed requirements tracking and progress monitoring is being developed.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case 'history':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Progression History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressionData?.progressionHistory && progressionData.progressionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {progressionData.progressionHistory.slice(0, 5).map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.from_role} → {item.to_role}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No progression history available.</p>
                )}
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
        <RoleManagementHeader
          currentRole={progressionData?.currentRole || ''}
          totalProgression={progressionData?.totalProgression || 0}
          pendingRequests={progressionData?.pendingRequests || 0}
          complianceRate={progressionData?.complianceRate || 0}
          nextEligibleRole={progressionData?.nextEligibleRole}
          onExportData={handleExportProgress}
        />

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeTab === 'progression' ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setActiveTab('progression')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progression Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track your career progression and advancement opportunities
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeTab === 'requirements' ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setActiveTab('requirements')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and track role progression requirements
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeTab === 'history' ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setActiveTab('history')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review your progression history and milestones
              </p>
            </CardContent>
          </Card>
        </div>

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
