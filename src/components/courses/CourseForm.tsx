
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BasicDetailsSection } from './BasicDetailsSection';
import { DurationSection } from './DurationSection';
import { CertificationSection } from './CertificationSection';
import { CourseTypeSection } from './CourseTypeSection';
import { AssessmentTypeSection } from './AssessmentTypeSection';
import { useCourseCreation } from './hooks/useCourseCreation';
import { useCourseTypes } from '@/hooks/useCourseTypes';

export function CourseForm() {
  const {
    formState,
    setters,
    createCourse,
    user
  } = useCourseCreation();

  const { courseTypes } = useCourseTypes();
  
  // Find the selected course type
  const selectedCourseType = courseTypes.find(type => type.id === formState.courseTypeId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    const courseData = {
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      course_type_id: formState.courseTypeId || undefined,
      assessment_type_id: formState.assessmentTypeId || undefined,
      length: formState.courseLength ? parseInt(formState.courseLength) : undefined,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : null,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : null,
    };

    createCourse.mutate(courseData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicDetailsSection
        name={formState.name}
        description={formState.description}
        onNameChange={setters.setName}
        onDescriptionChange={setters.setDescription}
      />
      
      <CourseTypeSection
        courseTypeId={formState.courseTypeId}
        onCourseTypeChange={setters.setCourseTypeId}
      />
      
      <AssessmentTypeSection
        assessmentTypeId={formState.assessmentTypeId}
        onAssessmentTypeChange={setters.setAssessmentTypeId}
      />
      
      <DurationSection
        expirationMonths={formState.expirationMonths}
        courseLength={formState.courseLength}
        onExpirationMonthsChange={setters.setExpirationMonths}
        onCourseLengthChange={setters.setCourseLength}
      />

      <CertificationSection
        firstAidLevel={formState.firstAidLevel}
        cprLevel={formState.cprLevel}
        courseTypeId={formState.courseTypeId}
        onFirstAidLevelChange={setters.setFirstAidLevel}
        onCprLevelChange={setters.setCprLevel}
      />
      
      <Button 
        type="submit" 
        className="w-full transition-all hover:shadow-md"
        disabled={createCourse.isPending}
      >
        {createCourse.isPending ? (
          <>Creating...</>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </>
        )}
      </Button>
    </form>
  );
}
