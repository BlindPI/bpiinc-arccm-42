import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from '../components/ui/toaster';
import { TierRequirementsMatrix } from '../components/compliance/views/TierRequirementsMatrix';

const Compliance: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Please log in to view compliance.</div>
      </div>
    );
  }

  // For SA/AD users (System Admin/Admin), provide full oversight and visibility
  // SA and AD roles should have access to all compliance templates and oversight
  const getUserRoleForCompliance = () => {
    if (user.role === 'SA' || user.role === 'AD') {
      // SA/AD users get full visibility - treat as AP (Authorized Personnel) for matrix access
      // but with additional administrative privileges
      return 'AP';
    }
    return user.role as 'AP' | 'IC' | 'IP' | 'IT';
  };

  const isAdminRole = user.role === 'SA' || user.role === 'AD';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name || user.email}</p>
          {isAdminRole && (
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md inline-block">
              Administrator View - Full System Oversight
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <TierRequirementsMatrix
          userRole={getUserRoleForCompliance()}
          currentTier="basic"
          userComplianceRecords={[]}
          onUploadDocument={() => {}}
          onTierSwitch={() => {}}
        />
      </div>
      
      <Toaster />
    </div>
  );
};

export default Compliance;
