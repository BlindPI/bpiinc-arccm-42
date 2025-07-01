import { useCourseData } from '@/hooks/useCourseData';
import { useBatchUpload } from './BatchCertificateContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, Loader2 } from 'lucide-react';
export function SelectCourseSection() {
  const {
    enableCourseMatching,
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    extractedCourse,
    hasCourseMatches
  } = useBatchUpload();
  const {
    data: courses,
    isLoading
  } = useCourseData();
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
  };
  return <div className="space-y-4 border rounded-lg p-4 bg-background/50">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Course Information</h3>
          
          {extractedCourse && <Badge variant="outline" className="font-normal">
              {extractedCourse.firstAidLevel && extractedCourse.cprLevel ? `${extractedCourse.firstAidLevel} with ${extractedCourse.cprLevel}` : extractedCourse.name || extractedCourse.firstAidLevel || 'Course info extracted'}
            </Badge>}
        </div>
        
        <div className="flex items-start gap-2">
          <Checkbox id="enable-course-matching" checked={enableCourseMatching} onCheckedChange={checked => setEnableCourseMatching(!!checked)} />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="enable-course-matching" className="text-sm font-medium leading-none flex items-center gap-1.5">
              Enable Course Matching
              {hasCourseMatches && <Badge variant="success" className="text-xs">Matches Found</Badge>}
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically match courses based on extracted information
            </p>
          </div>
        </div>
      </div>
      
      
    </div>;
}