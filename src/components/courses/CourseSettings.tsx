
import React from 'react';
import { CertificationLevelsTable } from './certification-levels/CertificationLevelsTable';
import { CourseTypesTable } from './course-types/CourseTypesTable';
import { AssessmentTypesTable } from './assessment-types/AssessmentTypesTable';
import { PrerequisitesTable } from './prerequisites/PrerequisitesTable';
import { CourseTypeCertificationManager } from './certification-levels/CourseTypeCertificationManager';
import { CertificationTypeManager } from './certification-levels/CertificationTypeManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCertificationLevelTypes } from '@/hooks/useCertificationLevelTypes';

export function CourseSettings() {
  const { certificationTypes, isLoading: typesLoading } = useCertificationLevelTypes();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Course Settings</h1>
      
      <Tabs defaultValue="certification-types">
        <TabsList className="mb-4 grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="certification-types">Certification Types</TabsTrigger>
          <TabsTrigger value="certification-levels">Certification Levels</TabsTrigger>
          <TabsTrigger value="course-types">Course Types</TabsTrigger>
          <TabsTrigger value="type-associations">Type Associations</TabsTrigger>
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="assessment-types">Assessment Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certification-types" className="space-y-6">
          <CertificationTypeManager />
        </TabsContent>

        <TabsContent value="certification-levels" className="space-y-6">
          {typesLoading ? (
            <p>Loading certification types...</p>
          ) : (
            certificationTypes.map(type => (
              <CertificationLevelsTable key={type} type={type} />
            ))
          )}
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
