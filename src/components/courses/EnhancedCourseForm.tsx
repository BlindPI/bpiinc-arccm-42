
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Save } from 'lucide-react';
import { useCourseForm } from '@/hooks/useCourseForm';
import { DurationFields } from './form-sections/DurationFields';
import { CourseTypesSection } from './form-sections/CourseTypesSection';
import { CertificationLevelSection } from './form-sections/CertificationLevelSection';
import { AdditionalCertificationsSection } from './form-sections/AdditionalCertificationsSection';
import { Course } from '@/types/courses';
import { useUpdateCourse } from '@/hooks/useUpdateCourse';
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCourseCertificationValues } from '@/hooks/useCourseCertificationValues';

interface EnhancedCourseFormProps {
  onSuccess?: () => void;
  course?: Course;
  mode?: 'create' | 'edit';
}

export function EnhancedCourseForm({ onSuccess, course, mode = 'create' }: EnhancedCourseFormProps) {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // For edit mode - fetch certification values
  const { 
    certificationValues, 
    updateCertificationValue 
  } = useCourseCertificationValues(course?.id);
  
  // For creation mode
  const { formState, updateField, handleSubmit, isSubmitting, hasPermission } = useCourseForm({ onSuccess });
  
  // For edit mode
  const updateCourseMutation = useUpdateCourse();
  const [editState, setEditState] = useState({
    name: course?.name || '',
    code: course?.code || '',
    description: course?.description || '',
    expirationMonths: course?.expiration_months?.toString() || '24',
    courseLength: course?.length?.toString() || '',
    courseTypeId: course?.course_type_id || 'none',
    firstAidLevel: course?.first_aid_level || 'none',
    cprLevel: course?.cpr_level || 'none',
    reason: '',
    // New state for certification values that will be modified separately
    certificationValues: {} as Record<string, string>,
  });
  
  // Update edit state when course changes
  useEffect(() => {
    if (course && mode === 'edit') {
      setEditState(prev => ({
        ...prev,
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        expirationMonths: course.expiration_months?.toString() || '24',
        courseLength: course.length?.toString() || '',
        courseTypeId: course.course_type_id || 'none',
        firstAidLevel: course.first_aid_level || 'none',
        cprLevel: course.cpr_level || 'none',
        reason: '',
      }));
    }
  }, [course, mode]);
  
  // For tracking certification values in create mode
  const [createCertValues, setCreateCertValues] = useState<Record<string, string>>({});
  
  const updateEditField = (field: string, value: string) => {
    setEditState(prev => ({ ...prev, [field]: value }));
  };
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;
    
    // Update the course first
    await updateCourseMutation.mutateAsync({
      id: course.id,
      name: editState.name,
      code: editState.code,
      description: editState.description,
      expiration_months: parseInt(editState.expirationMonths),
      course_type_id: editState.courseTypeId !== 'none' ? editState.courseTypeId : null,
      length: editState.courseLength ? parseInt(editState.courseLength) : null,
      first_aid_level: editState.firstAidLevel !== 'none' ? editState.firstAidLevel : null,
      cpr_level: editState.cprLevel !== 'none' ? editState.cprLevel : null,
      reason: editState.reason || undefined,
    });
    
    // Then update all certification values
    if (course.id) {
      // Add FIRST_AID and CPR values to certification_values for consistency
      const allCertValues = {
        ...editState.certificationValues
      };
      
      if (editState.firstAidLevel !== 'none') {
        allCertValues['FIRST_AID'] = editState.firstAidLevel;
      }
      
      if (editState.cprLevel !== 'none') {
        allCertValues['CPR'] = editState.cprLevel;
      }
      
      // Get current certification values to compare
      const currentValues = certificationValues || {};
      
      // Find values to add or update
      for (const [type, value] of Object.entries(allCertValues)) {
        if (currentValues[type] !== value) {
          await updateCertificationValue.mutateAsync({
            courseId: course.id,
            type,
            value
          });
        }
      }
      
      // Find values to remove (keys in currentValues but not in allCertValues)
      for (const type of Object.keys(currentValues)) {
        if (type !== 'FIRST_AID' && type !== 'CPR' && !allCertValues[type]) {
          await updateCertificationValue.mutateAsync({
            courseId: course.id,
            type,
            value: null
          });
        }
      }
    }
    
    if (onSuccess) onSuccess();
  };

  const currentState = mode === 'create' ? formState : editState;
  const setField = mode === 'create' ? updateField : updateEditField;
  const submitHandler = mode === 'create' ? handleSubmit : handleEdit;
  const isProcessing = mode === 'create' ? isSubmitting : updateCourseMutation.isPending;
  
  // Combined certification values for UI
  const displayedCertValues = mode === 'create' ? 
    createCertValues : 
    (certificationValues || {});
  
  // Handle certification values change
  const handleCertificationValuesChange = (values: Record<string, string>) => {
    if (mode === 'create') {
      setCreateCertValues(values);
    } else {
      setEditState(prev => ({
        ...prev,
        certificationValues: values
      }));
    }
  };
  
  // Show message if no permission
  if (!isAdmin && mode === 'create') {
    return (
      <CardContent>
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-red-500 mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You do not have permission to create courses. Please contact an administrator.
          </p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <form onSubmit={submitHandler} className="space-y-4">
        {/* Basic Details */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Course Name *
          </Label>
          <Input
            id="name"
            value={currentState.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            placeholder="Enter course name"
            className="focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* New Course Code Field */}
        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Course Code
          </Label>
          <Input
            id="code"
            value={currentState.code || ''}
            onChange={(e) => setField('code', e.target.value)}
            placeholder="Optional unique identifier (e.g., FA-STD-101)"
            className="focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            A unique identifier for this course that can be used for reference and matching
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={currentState.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Enter course description (optional)"
            className="min-h-[80px] focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* Duration Fields */}
        <DurationFields
          expirationMonths={currentState.expirationMonths}
          courseLength={currentState.courseLength}
          onExpirationMonthsChange={(value) => setField('expirationMonths', value)}
          onCourseLengthChange={(value) => setField('courseLength', value)}
        />

        {/* Course Type */}
        <CourseTypesSection
          courseTypeId={currentState.courseTypeId}
          onCourseTypeChange={(value) => setField('courseTypeId', value)}
        />

        {/* Certification Levels - Standard First Aid and CPR */}
        <CertificationLevelSection
          firstAidLevel={currentState.firstAidLevel}
          cprLevel={currentState.cprLevel}
          onFirstAidLevelChange={(value) => setField('firstAidLevel', value)}
          onCprLevelChange={(value) => setField('cprLevel', value)}
        />
        
        {/* New Additional Certifications Section */}
        <AdditionalCertificationsSection
          certificationValues={displayedCertValues}
          onCertificationValuesChange={handleCertificationValuesChange}
        />
        
        {/* Reason field for audit logs - only when editing */}
        {mode === 'edit' && (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="reason">Reason for Change (optional)</Label>
            <Textarea
              id="reason"
              value={editState.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Enter reason for this change (will be recorded in audit logs)"
              className="min-h-[80px] focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full transition-all hover:shadow-md mt-4"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>{mode === 'create' ? 'Creating...' : 'Saving...'}</>
          ) : (
            <>
              {mode === 'create' ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </>
          )}
        </Button>
      </form>
    </CardContent>
  );
}
