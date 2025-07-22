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

  return (
    <ComplianceDashboard
      userId={user.id}
      userRole={user.role || 'IC'}
      displayName={user.full_name || user.email}
    />
  );
};

export default Compliance;
