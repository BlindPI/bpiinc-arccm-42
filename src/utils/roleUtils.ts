
import { UserRole } from '@/lib/roles';
import { ROLE_HIERARCHY } from '@/lib/roles';

export const isAP = (role?: UserRole) => role === 'AP';

export const getNextRole = (currentRole: UserRole): UserRole | null => {
  const roleOrder: UserRole[] = ['IT', 'IP', 'IC', 'AP', 'AD', 'SA'];
  const currentIndex = roleOrder.indexOf(currentRole);
  
  if (currentIndex === -1 || currentIndex === roleOrder.length - 1) {
    return null;
  }
  
  return roleOrder[currentIndex + 1];
};

export const canRequestUpgrade = (currentRole: UserRole | undefined, toRole: UserRole) => {
  if (!currentRole) return false;
  const nextRole = getNextRole(currentRole);
  return nextRole === toRole;
};

export const canReviewRequest = (userRole: UserRole | undefined, request: any) => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole].includes(request.to_role);
};

export const filterTransitionRequests = (
  requests: any[] | undefined,
  userId: string | undefined,
  canReviewFn: (request: any) => boolean
) => {
  if (!requests) return { pendingRequests: [], userHistory: [], reviewableRequests: [] };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const userHistory = requests.filter(r => r.user_id === userId);
  const reviewableRequests = pendingRequests.filter(r => canReviewFn(r));

  return {
    pendingRequests,
    userHistory,
    reviewableRequests,
  };
};

export const getAuditRequests = (
  pendingRequests: any[],
  userRole?: UserRole
) => {
  const itToIpTransitions = pendingRequests.filter(r => 
    r.from_role === 'IT' && 
    r.to_role === 'IP' && 
    isAP(userRole)
  );

  const ipToIcTransitions = pendingRequests.filter(r => 
    r.from_role === 'IP' && 
    r.to_role === 'IC' && 
    isAP(userRole)
  );

  return {
    itToIpTransitions,
    ipToIcTransitions,
  };
};
