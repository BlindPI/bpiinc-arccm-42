
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus } from 'lucide-react';
import { useCourseForm } from '@/hooks/useCourseForm';
import { DurationFields } from './form-sections/DurationFields';
import { CourseTypesSection } from './form-sections/CourseTypesSection';
import { CertificationLevelSection } from './form-sections/CertificationLevelSection';

interface EnhancedCourseFormProps {
  onSuccess?: () => void;
}

export function EnhancedCourseForm({ onSuccess }: EnhancedCourseFormProps) {
  const { formState, updateField, handleSubmit, isSubmitting } = useCourseForm({ onSuccess });

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Details */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Course Name *
          </Label>
          <Input
            id="name"
            value={formState.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            placeholder="Enter course name"
            className="focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Enter course description (optional)"
            className="min-h-[80px] focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* Duration Fields */}
        <DurationFields
          expirationMonths={formState.expirationMonths}
          courseLength={formState.courseLength}
          onExpirationMonthsChange={(value) => updateField('expirationMonths', value)}
          onCourseLengthChange={(value) => updateField('courseLength', value)}
        />

        {/* Course Type */}
        <CourseTypesSection
          courseTypeId={formState.courseTypeId}
          onCourseTypeChange={(value) => updateField('courseTypeId', value)}
        />

        {/* Certification Levels - Essential for matching */}
        <CertificationLevelSection
          firstAidLevel={formState.firstAidLevel}
          cprLevel={formState.cprLevel}
          onFirstAidLevelChange={(value) => updateField('firstAidLevel', value)}
          onCprLevelChange={(value) => updateField('cprLevel', value)}
        />
        
        <Button 
          type="submit" 
          className="w-full transition-all hover:shadow-md mt-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>Creating...</>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </>
          )}
        </Button>
      </form>
    </CardContent>
  );
}
