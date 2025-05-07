
import React from 'react';
import { CertificationLevelsTable } from './certification-levels/CertificationLevelsTable';
import { CourseTypesTable } from './course-types/CourseTypesTable';
import { AssessmentTypesTable } from './assessment-types/AssessmentTypesTable';
import { PrerequisitesTable } from './prerequisites/PrerequisitesTable';
import { CourseTypeCertificationManager } from './certification-levels/CourseTypeCertificationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CourseSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Course Settings</h1>
      
      <Tabs defaultValue="certification-levels">
        <TabsList className="mb-4 grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="certification-levels">Certification Levels</TabsTrigger>
          <TabsTrigger value="course-types">Course Types</TabsTrigger>
          <TabsTrigger value="type-associations">Type Associations</TabsTrigger>
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="assessment-types">Assessment Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certification-levels" className="space-y-6">
          <CertificationLevelsTable type="FIRST_AID" />
          <CertificationLevelsTable type="CPR" />
        </TabsContent>
        
        <TabsContent value="course-types">
          <CourseTypesTable />
        </TabsContent>
        
        <TabsContent value="type-associations">
          <CourseTypeCertificationManager />
        </TabsContent>
        
        <TabsContent value="prerequisites">
          <PrerequisitesTable />
        </TabsContent>
        
        <TabsContent value="assessment-types">
          <AssessmentTypesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
