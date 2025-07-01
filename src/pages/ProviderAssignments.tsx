/**
 * PROVIDER ASSIGNMENTS PAGE
 * 
 * Main page for managing all Authorized Provider assignments.
 * Addresses the UI/UX disconnect by providing a unified view of:
 * - All AP Users
 * - Their assigned locations
 * - Their assigned teams  
 * - Controls to change location and team assignments
 */

import React from 'react';
import { ProviderAssignmentManager } from '@/components/providers/ProviderAssignmentManager';

export const ProviderAssignments: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Provider Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive management of Authorized Provider users, their location assignments, and team assignments.
            View all AP users, see their current assignments, and make changes as needed.
          </p>
        </div>

        {/* Main Assignment Manager */}
        <ProviderAssignmentManager />
      </div>
    </div>
  );
};

export default ProviderAssignments;