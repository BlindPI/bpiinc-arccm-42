
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, ClipboardList, Clock, MessageSquare } from 'lucide-react';
import { RoleHierarchyCard } from '@/components/role-management/RoleHierarchyCard';
import { RoleTransitionRequestCard } from '@/components/role-management/RoleTransitionRequestCard';
import { ReviewableRequestsCard } from '@/components/role-management/ReviewableRequestsCard';
import { TransitionHistoryCard } from '@/components/role-management/TransitionHistoryCard';
import { AuditFormUpload } from '@/components/role-management/AuditFormUpload';
import { VideoSubmissionUpload } from '@/components/role-management/VideoSubmissionUpload';
import { TeachingProgress } from '@/components/role-management/TeachingProgress';
import { DocumentRequirements } from '@/components/role-management/DocumentRequirements';
import { HourLoggingInterface } from '@/components/role-management/HourLoggingInterface';
import { DocumentManagementInterface } from '@/components/role-management/DocumentManagementInterface';
import { useRoleTransitions } from '@/hooks/useRoleTransitions';
import { useProfile } from '@/hooks/useProfile';
import { canRequestUpgrade, canReviewRequest, filterTransitionRequests, getAuditRequests, getNextRole } from '@/utils/roleUtils';
import { UserRole } from '@/lib/roles';
import { SupervisorEvaluationForm } from '@/components/role-management/SupervisorEvaluationForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStatus } from '@/components/role-management/ComplianceStatus';
import { Separator } from '@/components/ui/separator';
import { EvaluableTeachingSession } from '@/types/supabase-views';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProgressionPaths } from "@/hooks/useProgressionPaths";
import { ProgressTracker } from "@/components/role-management/progression/ProgressTracker";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RoleManagement = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Shield className="h-7 w-7 text-primary" />}
        title="Role Management"
        subtitle="Track your progression and manage role transitions"
        badge={currentRole !== 'SA' ? {
          text: `Current Role: ${currentRole}`,
          variant: "secondary"
        } : undefined}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <RoleHierarchyCard currentRole={profile!.role} />
          <ComplianceStatus userId={user.id} />
        </div>
        <div className="space-y-6">
          <RoleTransitionRequestCard
            currentRole={profile!.role}
            canRequestUpgrade={(toRole) => canRequestUpgrade(profile?.role, toRole)}
            createTransitionRequest={createTransitionRequest}
          />
        </div>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card">
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {!validPath ? (
              <Card className="col-span-full border-2 border-yellow-400/30 bg-yellow-50/90 text-center py-10 px-6 flex flex-col items-center gap-3 animate-fade-in">
                <MessageSquare className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  Advancement Not Configured
                </h3>
                <p className="text-yellow-900">
                  There is currently no advancement requirements defined for progressing from <b>{currentRole}</b> to <b>{nextRole}</b>.<br />
                  Please contact your administrator for more information.
                </p>
              </Card>
            ) : currentRole === 'SA' ? (
              <Card className="col-span-full border-2 border-gray-300/30 bg-gray-50/90 text-center py-10 px-6 flex flex-col items-center gap-3 animate-fade-in">
                <Clock className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  No Eligible Upgrades
                </h3>
                <p className="text-gray-900">
                  There are no eligible upgrades available from your current role.
                </p>
              </Card>
            ) : (
              <>
                <ProgressTracker targetRole={nextRole} />
                <DocumentRequirements 
                  userId={user.id}
                  fromRole={currentRole}
                  toRole={nextRole}
                />
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DocumentManagementInterface userId={user.id} />
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
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <TransitionHistoryCard userHistory={userHistory} />
            {reviewableRequests.length > 0 && (
              <ReviewableRequestsCard
                reviewableRequests={reviewableRequests}
                updateTransitionRequest={updateTransitionRequest}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {profile?.role === 'AP' && evaluableSessions && evaluableSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Supervisor Evaluations</h3>
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
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
