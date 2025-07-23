import React from 'react';
import UserComplianceManager from './UserComplianceManager';

export function AdminComplianceOverview() {
  // Show the admin role management view instead of personal compliance dashboard
  return <UserComplianceManager />;
}