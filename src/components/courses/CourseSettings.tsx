
import React from 'react';
import { CertificationLevelsTable } from './certification-levels/CertificationLevelsTable';

export function CourseSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Course Settings</h1>
      
      <div className="space-y-6">
        <CertificationLevelsTable type="FIRST_AID" />
        <CertificationLevelsTable type="CPR" />
      </div>
    </div>
  );
}
