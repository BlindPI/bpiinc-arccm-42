import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceTier } from '@/hooks/useComplianceTier';

// Import REAL enterprise compliance components
import { ComplianceProgressDashboard } from '@/components/compliance/ComplianceProgressDashboard';
import { TierStatusHeader } from '@/components/compliance/TierStatusHeader';
import { TierRequirementSection } from '@/components/compliance/TierRequirementSection';
import { TierBenefitsOverview } from '@/components/compliance/TierBenefitsOverview';
import { ComplianceMilestoneTracker } from '@/components/compliance/ComplianceMilestoneTracker';

export default function ComplianceProviderDashboard() {
  const { data: profile } = useProfile();
  
  // Get REAL tier data from ComplianceTierService - NO MOCK DATA
  const { tierInfo, loading: tierLoading } = useComplianceTier(profile?.id);

  // Check if user has provider access (AP)
  const hasProviderAccess = profile?.role === 'AP';

  if (!hasProviderAccess) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You do not have permission to access the provider compliance dashboard.
                This area is restricted to Authorized Providers only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Provider Compliance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Location and team compliance oversight for authorized providers
          </p>
        </div>
      </div>

      {/* Provider Status Header - Using REAL Enterprise Component with REAL data */}
      {!tierLoading && tierInfo && (
        <TierStatusHeader 
          tierInfo={tierInfo}
          onOpenTierSwitch={() => {
            console.log('Tier switch dialog opened for provider');
          }}
        />
      )}

      {/* Main Dashboard Content - Using REAL Enterprise Components */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Team Compliance Progress Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Team Compliance Progress
              </CardTitle>
              <CardDescription>
                Overview of compliance progress for your location and team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceProgressDashboard />
            </CardContent>
          </Card>
        </div>

        {/* Team Requirements Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Team Requirements
              </CardTitle>
              <CardDescription>
                Compliance requirements for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!tierLoading && tierInfo && (
                <TierRequirementSection 
                  tier={tierInfo.tier}
                  requirements={tierInfo.requirements || []}
                  onRequirementClick={(req) => {
                    console.log('Requirement clicked:', req);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tier Benefits Overview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Available Benefits
              </CardTitle>
              <CardDescription>
                Benefits and features available for your compliance tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TierBenefitsOverview 
                tier={tierInfo?.tier || 'basic'}
                role={profile?.role || 'AP'}
                onTierChange={(newTier) => {
                  console.log('Tier change requested:', newTier);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Compliance Milestones Tracker */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Compliance Milestones & Achievements
              </CardTitle>
              <CardDescription>
                Track milestone progress and celebrate team achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceMilestoneTracker 
                userId={profile?.id || ''}
                userRole={profile?.role || 'AP'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}