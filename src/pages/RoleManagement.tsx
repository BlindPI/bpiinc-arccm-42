
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Shield, ClipboardList, Clock } from 'lucide-react';
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
import { DocumentReviewInterface } from '@/components/role-management/DocumentReviewInterface';
import { canRequestUpgrade, canReviewRequest, filterTransitionRequests, getAuditRequests } from '@/utils/roleUtils';
import { UserRole } from '@/lib/roles';
import { SupervisorEvaluationForm } from '@/components/role-management/SupervisorEvaluationForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStatus } from '@/components/role-management/ComplianceStatus';
import { Separator } from '@/components/ui/separator';
import { useRoleTransitions } from '@/hooks/useRoleTransitions';
import { useProfile } from '@/hooks/useProfile';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface EvaluableTeachingSession {
  teaching_session_id: string;
  instructor_id: string;
  instructor_name: string;
  course_name: string;
  session_date: string;
  evaluation_id: string | null;
}

const RoleManagement = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { 
    transitionRequests,
    requestsLoading,
    createTransitionRequest,
    updateTransitionRequest,
    handleUploadSuccess,
  } = useRoleTransitions();

  const { data: evaluableSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['evaluable-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluable_teaching_sessions')
        .select('teaching_session_id, instructor_id, instructor_name, course_name, session_date, evaluation_id');
      
      if (error) throw error;
      return (data || []) as EvaluableTeachingSession[];
    },
    enabled: profile?.role === 'AP'
  });

  if (!user) return null;

  if (profileLoading || requestsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Add a null check for profile here
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <p>Error loading profile. Please try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { pendingRequests, userHistory, reviewableRequests } = filterTransitionRequests(
    transitionRequests,
    user.id,
    (request) => canReviewRequest(profile.role, request)
  );

  const { itToIpTransitions, ipToIcTransitions } = getAuditRequests(
    pendingRequests,
    profile.role
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
            <p className="text-muted-foreground">
              Manage your role and compliance requirements
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Prominent Role Progress Section */}
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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
          
          <TabsContent value="progress" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <TeachingProgress userId={user.id} />
              <DocumentRequirements 
                userId={user.id}
                fromRole={profile!.role}
                toRole={getNextRole(profile!.role)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
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
          
          <TabsContent value="history" className="space-y-6">
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
    </DashboardLayout>
  );
};

const getNextRole = (currentRole: UserRole): UserRole => {
  const roleProgression: { [key in UserRole]: UserRole } = {
    'IT': 'IP',
    'IP': 'IC',
    'IC': 'AP',
    'AP': 'AD',
    'AD': 'SA',
    'SA': 'SA'
  };
  
  return roleProgression[currentRole];
};

export default RoleManagement;

