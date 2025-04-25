
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BasicDetailsSection } from './BasicDetailsSection';
import { DurationSection } from './DurationSection';
import { CertificationSection } from './CertificationSection';
import { useCourseCreation } from './hooks/useCourseCreation';

export function CourseForm() {
  const {
    formState,
    setters,
    createCourse,
    user
  } = useCourseCreation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    createCourse.mutate({
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      length: formState.courseLength ? parseInt(formState.courseLength) : undefined,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : null,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicDetailsSection
        name={formState.name}
        description={formState.description}
        onNameChange={setters.setName}
        onDescriptionChange={setters.setDescription}
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
