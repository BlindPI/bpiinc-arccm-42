
import React, { useState } from 'react';
import { useCourseTypes } from '@/hooks/useCourseTypes';
import { useCourseTypeCertificationLevels } from '@/hooks/useCourseTypeCertificationLevels';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { CourseTypeSelector } from './CourseTypeSelector';
import { CertificationLevelSelector } from './CertificationLevelSelector';
import { CertificationLevelsList } from './CertificationLevelsList';

export function CourseTypeCertificationManager() {
  const [selectedCourseTypeId, setSelectedCourseTypeId] = useState('');
  const [selectedCertificationLevelId, setSelectedCertificationLevelId] = useState('');
  
  const { courseTypes } = useCourseTypes();
  
  const {
    relationships,
    isLoading: relationshipsLoading,
    associateCertificationLevel,
    removeCertificationLevelAssociation
  } = useCourseTypeCertificationLevels(selectedCourseTypeId);

  // Group relationships by certification level type
  const groupedRelationships = React.useMemo(() => {
    if (!relationships) return {};
    
    return relationships.reduce((acc: Record<string, any[]>, curr) => {
      const type = curr.certification_level?.type || 'Unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    }, {});
  }, [relationships]);

  // Get selected course type name
  const selectedCourseTypeName = React.useMemo(() => {
    if (!selectedCourseTypeId) return '';
    const courseType = courseTypes.find(type => type.id === selectedCourseTypeId);
    return courseType?.name || '';
  }, [selectedCourseTypeId, courseTypes]);

  const handleAddAssociation = () => {
    if (!selectedCourseTypeId || !selectedCertificationLevelId) {
      toast.error('Please select both a course type and certification level');
      return;
    }
    
    // Check if this association already exists
    const existingRelationship = relationships?.find(
      rel => rel.certification_level_id === selectedCertificationLevelId
    );
    
    if (existingRelationship) {
      toast.error('This certification level is already associated with this course type');
      return;
    }
    
    associateCertificationLevel.mutate({
      course_type_id: selectedCourseTypeId,
      certification_level_id: selectedCertificationLevelId
    });
    
    // Reset the selected certification level
    setSelectedCertificationLevelId('');
  };

  const handleRemoveAssociation = (id: string) => {
    removeCertificationLevelAssociation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Type Certification Levels</CardTitle>
        <CardDescription>
          Manage which certification levels are available for each course type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CourseTypeSelector
              selectedCourseTypeId={selectedCourseTypeId}
              setSelectedCourseTypeId={setSelectedCourseTypeId}
            />
            
            {selectedCourseTypeId && (
              <CertificationLevelSelector
                selectedCertificationLevelId={selectedCertificationLevelId}
                setSelectedCertificationLevelId={setSelectedCertificationLevelId}
                onAddAssociation={handleAddAssociation}
                isAdding={associateCertificationLevel.isPending}
              />
            )}
          </div>
          
          {selectedCourseTypeId && (
            <CertificationLevelsList
              groupedRelationships={groupedRelationships}
              onRemoveAssociation={handleRemoveAssociation}
              isRemoving={removeCertificationLevelAssociation.isPending}
              isLoading={relationshipsLoading}
              courseTypeName={selectedCourseTypeName}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
