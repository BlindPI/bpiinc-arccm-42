
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, ClipboardList, Clock, MessageSquare, BarChart3 } from 'lucide-react';
import { RoleManagementHeader } from '@/components/role-management/dashboard/RoleManagementHeader';
import { RoleManagementNavigation } from '@/components/role-management/navigation/RoleManagementNavigation';
import { RoleHierarchyCard } from '@/components/role-management/RoleHierarchyCard';
import { RoleTransitionRequestCard } from '@/components/role-management/RoleTransitionRequestCard';
import { ReviewableRequestsCard } from '@/components/role-management/ReviewableRequestsCard';
import { TransitionHistoryCard } from '@/components/role-management/TransitionHistoryCard';
import { AuditFormUpload } from '@/components/role-management/AuditFormUpload';
import { VideoSubmissionUpload } from '@/components/role-management/VideoSubmissionUpload';
import { DocumentRequirements } from '@/components/role-management/DocumentRequirements';
import { DocumentManagementInterface } from '@/components/role-management/DocumentManagementInterface';
import { useRoleTransitions } from '@/hooks/useRoleTransitions';
import { useProfile } from '@/hooks/useProfile';
import { canRequestUpgrade, canReviewRequest, filterTransitionRequests, getAuditRequests, getNextRole } from '@/utils/roleUtils';
import { UserRole } from '@/lib/roles';
import { SupervisorEvaluationForm } from '@/components/role-management/SupervisorEvaluationForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStatus } from '@/components/role-management/ComplianceStatus';
import { EvaluableTeachingSession } from '@/types/supabase-views';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProgressionPaths } from "@/hooks/useProgressionPaths";
import { ProgressTracker } from "@/components/role-management/progression/ProgressTracker";

const RoleManagement = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('progress');
  const { 
    transitionRequests,
    requestsLoading,
    createTransitionRequest,
    updateTransitionRequest,
    handleUploadSuccess,
  } = useRoleTransitions();

  const { paths: progressionPaths, loadingPaths: loadingProgressionPaths } = useProgressionPaths();

  const { data: evaluableSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['evaluable-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluable_teaching_sessions')
        .select('*');
      
      if (error) throw error;
      return data as unknown as EvaluableTeachingSession[];
    },
    enabled: !!profile?.role && profile.role === 'AP'
  });

  if (!user) return null;

  if (profileLoading || requestsLoading || loadingProgressionPaths) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { pendingRequests, userHistory, reviewableRequests } = filterTransitionRequests(
    transitionRequests,
    user.id,
    (request) => canReviewRequest(profile?.role, request)
  );

  const { itToIpTransitions, ipToIcTransitions } = getAuditRequests(
    pendingRequests,
    profile?.role
  );

  const currentRole = profile!.role;
  const nextRole = getNextRole(currentRole);
  const validPath = progressionPaths?.find(
    (p: any) => p.from_role === currentRole && p.to_role === nextRole
  );

  // Calculate metrics for header
  const totalProgression = transitionRequests?.length || 0;
  const complianceRate = 85; // Mock data - would come from actual compliance calculation
  const progressPercentage = validPath ? 65 : 0; // Mock progress percentage
  const completedDocuments = 3; // Mock completed documents count

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'progress':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <RoleHierarchyCard currentRole={profile!.role} />
              <ComplianceStatus userId={user.id} />
            </div>
            {!validPath ? (
              <Card className="border-2 border-yellow-400/30 bg-yellow-50/90 text-center py-10 px-6">
                <CardContent className="flex flex-col items-center gap-3">
                  <MessageSquare className="w-10 h-10 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Advancement Not Configured</h3>
                  <p className="text-yellow-900">
                    There is currently no advancement requirements defined for progressing from <b>{currentRole}</b> to <b>{nextRole}</b>.
                    Please contact your administrator for more information.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <ProgressTracker targetRole={nextRole} />
                <RoleTransitionRequestCard
                  currentRole={profile!.role}
                  canRequestUpgrade={(toRole) => canRequestUpgrade(profile?.role, toRole)}
                  createTransitionRequest={createTransitionRequest}
                />
              </div>
            )}
          </div>
        );
      case 'documents':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <DocumentManagementInterface userId={user.id} />
            <DocumentRequirements 
              userId={user.id}
              fromRole={currentRole}
              toRole={nextRole}
            />
            {itToIpTransitions.map(request => (
              <AuditFormUpload 
                key={request.id}
                transitionRequestId={request.id}
                onUploadSuccess={handleUploadSuccess}
              />
            ))}
            {ipToIcTransitions.map(request => (
              <div key={request.id} className="space-y-4">
                <AuditFormUpload 
                  transitionRequestId={request.id}
                  onUploadSuccess={handleUploadSuccess}
                />
                <VideoSubmissionUpload
                  transitionRequestId={request.id}
                  requiredCount={3}
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            ))}
          </div>
        );
      case 'history':
        return (
          <div className="grid gap-6">
            <TransitionHistoryCard userHistory={userHistory} />
            {reviewableRequests.length > 0 && (
              <ReviewableRequestsCard
                reviewableRequests={reviewableRequests}
                updateTransitionRequest={updateTransitionRequest}
              />
            )}
          </div>
        );
      case 'analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p>Comprehensive performance analytics and reporting coming soon</p>
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
        <RoleManagementHeader
          currentRole={currentRole}
          totalProgression={totalProgression}
          pendingRequests={pendingRequests.length}
          complianceRate={complianceRate}
          nextEligibleRole={nextRole}
        />

        {/* Navigation Cards */}
        <RoleManagementNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentRole}
          pendingRequests={pendingRequests.length}
          completedDocuments={completedDocuments}
          progressPercentage={progressPercentage}
        />

        {/* Content Area */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="animate-fade-in">
              {renderActiveContent()}
            </div>
          </CardContent>
        </Card>

        {/* Supervisor Evaluations for AP role */}
        {profile?.role === 'AP' && evaluableSessions && evaluableSessions.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Supervisor Evaluations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {evaluableSessions.map((session) => (
                  <SupervisorEvaluationForm
                    key={session.teaching_session_id}
                    teachingSessionId={session.teaching_session_id}
                    instructorId={session.instructor_id}
                    instructorName={session.instructor_name}
                    courseName={session.course_name}
                    sessionDate={session.session_date}
                    existingEvaluationId={session.evaluation_id || undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
