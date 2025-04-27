
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCourseData } from '@/hooks/useCourseData';
import { 
  Select,
  SelectContent,
  SelectGroup, 
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';

interface StepCourseDetailsProps {
  selectedCourseId: string;
  setSelectedCourseId: (value: string) => void;
  firstAidLevel: string;
  setFirstAidLevel: (value: string) => void;
  cprLevel: string;
  setCprLevel: (value: string) => void;
  assessmentStatus: string;
  setAssessmentStatus: (value: string) => void;
  locationId?: string;
  setLocationId?: (value: string) => void;
}

export function StepCourseDetails({
  selectedCourseId,
  setSelectedCourseId,
  firstAidLevel,
  setFirstAidLevel,
  cprLevel,
  setCprLevel,
  assessmentStatus,
  setAssessmentStatus,
  locationId,
  setLocationId
}: StepCourseDetailsProps) {
  const { data: courses, isLoading: isLoadingCourses } = useCourseData();
  const { locations, isLoading: isLoadingLocations } = useLocationData();
  
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    if (courses && selectedCourseId) {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setSelectedCourse(course);
        // Auto-populate fields from course if they're empty
        if (!firstAidLevel && course.first_aid_level) {
          setFirstAidLevel(course.first_aid_level);
        }
        if (!cprLevel && course.cpr_level) {
          setCprLevel(course.cpr_level);
        }
      }
    }
  }, [courses, selectedCourseId, firstAidLevel, cprLevel, setFirstAidLevel, setCprLevel]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Course Information</h3>
      
      {/* Course Selection */}
      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        {isLoadingCourses ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading courses...
          </div>
        ) : (
          <Select 
            value={selectedCourseId} 
            onValueChange={setSelectedCourseId}
          >
            <SelectTrigger id="course" className="w-full">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available Courses</SelectLabel>
                {courses?.filter(c => c.status === 'ACTIVE').map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Location Selection */}
      {setLocationId && (
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          {isLoadingLocations ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations...
            </div>
          ) : (
            <Select 
              value={locationId || 'none'} 
              onValueChange={setLocationId}
            >
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Locations</SelectLabel>
                  <SelectItem value="none">No location</SelectItem>
                  {locations?.filter(l => l.status === 'ACTIVE').map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      
      {/* First Aid Level */}
      <div className="space-y-2">
        <Label htmlFor="firstAidLevel">First Aid Level</Label>
        <Input
          id="firstAidLevel"
          value={firstAidLevel}
          onChange={(e) => setFirstAidLevel(e.target.value)}
          placeholder="e.g. Standard First Aid"
        />
      </div>
      
      {/* CPR Level */}
      <div className="space-y-2">
        <Label htmlFor="cprLevel">CPR Level</Label>
        <Input
          id="cprLevel"
          value={cprLevel}
          onChange={(e) => setCprLevel(e.target.value)}
          placeholder="e.g. CPR-C"
        />
      </div>
      
      {/* Assessment Status */}
      <div className="space-y-2">
        <Label htmlFor="assessment">Assessment Status</Label>
        <Select 
          value={assessmentStatus} 
          onValueChange={setAssessmentStatus}
        >
          <SelectTrigger id="assessment">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
