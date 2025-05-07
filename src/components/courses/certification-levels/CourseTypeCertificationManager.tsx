
import React, { useState } from 'react';
import { useCourseTypes } from '@/hooks/useCourseTypes';
import { useCertificationLevels } from '@/hooks/useCertificationLevels';
import { useCourseTypeCertificationLevels } from '@/hooks/useCourseTypeCertificationLevels';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function CourseTypeCertificationManager() {
  const [selectedCourseTypeId, setSelectedCourseTypeId] = useState('');
  const [selectedCertificationLevelId, setSelectedCertificationLevelId] = useState('');
  
  const { courseTypes, isLoading: courseTypesLoading } = useCourseTypes();
  const { certificationLevels, isLoading: certificationLevelsLoading } = useCertificationLevels();
  
  const {
    relationships,
    isLoading: relationshipsLoading,
    associateCertificationLevel,
    removeCertificationLevelAssociation
  } = useCourseTypeCertificationLevels(selectedCourseTypeId);

  // Filter active course types and certification levels
  const activeCourseTypes = courseTypes.filter(type => type.active);
  const activeCertificationLevels = certificationLevels.filter(level => level.active);

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

  const isLoading = courseTypesLoading || certificationLevelsLoading || relationshipsLoading;
  
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Type</label>
              <Select
                value={selectedCourseTypeId}
                onValueChange={setSelectedCourseTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Course Type" />
                </SelectTrigger>
                <SelectContent>
                  {courseTypesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : activeCourseTypes.length === 0 ? (
                    <SelectItem value="none" disabled>No course types available</SelectItem>
                  ) : (
                    activeCourseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCourseTypeId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Certification Level</label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCertificationLevelId}
                    onValueChange={setSelectedCertificationLevelId}
                    disabled={certificationLevelsLoading || !selectedCourseTypeId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Certification Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificationLevelsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : activeCertificationLevels.length === 0 ? (
                        <SelectItem value="none" disabled>No certification levels available</SelectItem>
                      ) : (
                        activeCertificationLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>{level.name} ({level.type})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddAssociation}
                    disabled={!selectedCertificationLevelId || associateCertificationLevel.isPending}
                  >
                    {associateCertificationLevel.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {selectedCourseTypeId && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Certification Levels for {selectedCourseTypeName}
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(groupedRelationships).length === 0 ? (
                <Alert variant="default">
                  <AlertDescription>
                    No certification levels are associated with this course type yet.
                    Add certification levels to enable them for this course type.
                  </AlertDescription>
                </Alert>
              ) : (
                Object.entries(groupedRelationships).map(([type, typeLevels]) => (
                  <div key={type} className="space-y-2">
                    <h4 className="font-medium">{type}</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeLevels.map((relationship) => (
                            <TableRow key={relationship.id}>
                              <TableCell>
                                {relationship.certification_level?.name || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveAssociation(relationship.id)}
                                  disabled={removeCertificationLevelAssociation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
