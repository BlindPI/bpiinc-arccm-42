import React from 'react';
import { CRMDiagnosticPanel } from '@/components/debug/CRMDiagnosticPanel';

export default function CRMDiagnostics() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <CRMDiagnosticPanel />
    </div>
  );
}