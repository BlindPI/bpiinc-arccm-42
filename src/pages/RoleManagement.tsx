import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Shield, ClipboardList, Clock, FileCheck } from 'lucide-react';
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
import { canRequestUpgrade, canReviewRequest, filterTransitionRequests, getAuditRequests } from '@/utils/roleUtils';
import { UserRole } from '@/lib/roles';
import { SupervisorEvaluationForm } from '@/components/role-management/SupervisorEvaluationForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStatus } from '@/components/role-management/ComplianceStatus';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";

interface ComplianceTask {
  id: string;
  issue_type: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  due_date: string;
}

interface TeachingSession {
  teaching_session_id: string;
  instructor_id: string;
  instructor_name: string;
  course_name: string;
  session_date: string;
  evaluation_id?: string;
}

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

  const { data: complianceTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['compliance-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_resolution_tasks')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('due_date', { ascending: true });
      
      if (error) {
        toast.error('Failed to fetch compliance tasks');
        throw error;
      }
      
      return data as ComplianceTask[];
    },
    enabled: !!user?.id
  });

  const { data: nextAudit } = useQuery({
    queryKey: ['next-audit', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_audit_schedule')
        .select('*')
        .eq('instructor_id', user?.id)
        .eq('status', 'SCHEDULED')
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        toast.error('Failed to fetch next audit');
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  const { data: evaluableSessions } = useQuery({
    queryKey: ['evaluable-sessions', user?.id],
    queryFn: async () => {
      if (profile?.role !== 'AP') return null;
      
      const { data, error } = await supabase
        .from('teaching_sessions')
        .select(`
          id,
          instructor_id,
          profiles!teaching_sessions_instructor_id_fkey(display_name),
          courses!teaching_sessions_course_id_fkey(name),
          session_date
        `)
        .eq('status', 'PENDING')
        .order('session_date', { ascending: false });
      
      if (error) {
        toast.error('Failed to fetch evaluable sessions');
        throw error;
      }
      
      return data.map(session => ({
        teaching_session_id: session.id,
        instructor_id: session.instructor_id,
        instructor_name: session.profiles.display_name,
        course_name: session.courses.name,
        session_date: session.session_date,
        evaluation_id: undefined // Since we're fetching only pending evaluations
      })) as TeachingSession[];
    },
    enabled: !!user?.id && profile?.role === 'AP'
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

  const { pendingRequests, userHistory, reviewableRequests } = filterTransitionRequests(
    transitionRequests,
    user.id,
    (request) => canReviewRequest(profile?.role, request)
  );

  const { itToIpTransitions, ipToIcTransitions } = getAuditRequests(
    pendingRequests,
    profile?.role
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Compliance
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

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {nextAudit && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Next Scheduled Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Type: {nextAudit.audit_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(nextAudit.scheduled_date).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {complianceTasks && complianceTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceTasks.map(task => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{task.issue_type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  existingEvaluationId={session.evaluation_id}
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
