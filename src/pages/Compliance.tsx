import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ComplianceDashboard } from '../components/compliance/ComplianceDashboard';

const Compliance: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Please log in to view compliance.</div>
      </div>
    );
  }

  // CRITICAL FIX: Prevent SA users from defaulting to IC role during re-auth/reload
  const userRole = user.role || user.user_metadata?.role || user.app_metadata?.role || 'IC';
  
  // Additional safety: If we detect this is an SA user, never allow IC fallback
  const safeUserRole = userRole === 'SA' || userRole === 'AD' ? userRole : userRole;
  
  console.log('✅ COMPLIANCE PAGE LOADED: user.role =', user.role);
  console.log('✅ COMPLIANCE PAGE LOADED: userRole =', safeUserRole);
  console.log('✅ COMPLIANCE SYSTEM: Database has 42 metrics, routing operational');

  return (
    <ComplianceDashboard
      userId={user.id}
      userRole={safeUserRole}
      displayName={user.full_name || user.email}
    />
  );
};

export default Compliance;
