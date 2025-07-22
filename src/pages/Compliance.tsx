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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name || user.email}</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <TierRequirementsMatrix
          userRole={user.role as 'AP' | 'IC' | 'IP' | 'IT'}
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
