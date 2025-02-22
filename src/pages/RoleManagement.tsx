
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { RoleHierarchyCard } from '@/components/role-management/RoleHierarchyCard';
import { RoleTransitionRequestCard } from '@/components/role-management/RoleTransitionRequestCard';
import { ReviewableRequestsCard } from '@/components/role-management/ReviewableRequestsCard';
import { TransitionHistoryCard } from '@/components/role-management/TransitionHistoryCard';
import { AuditFormUpload } from '@/components/role-management/AuditFormUpload';
import { VideoSubmissionUpload } from '@/components/role-management/VideoSubmissionUpload';
import { useRoleTransitions } from '@/hooks/useRoleTransitions';
import { useProfile } from '@/hooks/useProfile';
import { canRequestUpgrade, canReviewRequest, filterTransitionRequests, getAuditRequests } from '@/utils/roleUtils';

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
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            View and manage your role in the organization
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RoleHierarchyCard currentRole={profile!.role} />
          <RoleTransitionRequestCard
            currentRole={profile!.role}
            canRequestUpgrade={(toRole) => canRequestUpgrade(profile?.role, toRole)}
            createTransitionRequest={createTransitionRequest}
          />
        </div>

        <>
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
        </>

        <ReviewableRequestsCard
          reviewableRequests={reviewableRequests}
          updateTransitionRequest={updateTransitionRequest}
        />

        <TransitionHistoryCard userHistory={userHistory} />
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
