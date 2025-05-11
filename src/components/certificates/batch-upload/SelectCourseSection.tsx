
import { useCourseData } from "@/hooks/useCourseData";
import { useBatchUpload } from "./BatchCertificateContext";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SelectCourseSection() {
  const { 
    selectedCourseId, 
    setSelectedCourseId,
    extractedCourse,
    enableCourseMatching,
    setEnableCourseMatching,
    hasCourseMatches
  } = useBatchUpload();
  
  const { data: courses, isLoading } = useCourseData();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }
  
  const selectedCourse = courses?.find(c => c.id === selectedCourseId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-base font-medium">Course Selection</h3>
        
        <div className="flex items-center gap-2">
          <Switch
            id="enable-matching"
            checked={enableCourseMatching}
            onCheckedChange={setEnableCourseMatching}
            size="sm"
          />
          <Label htmlFor="enable-matching" className="text-sm">
            Auto-match courses
          </Label>
        </div>
      </div>
      
      {hasCourseMatches && enableCourseMatching ? (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Course matching active</AlertTitle>
          <AlertDescription className="text-green-700 text-sm">
            The system has automatically matched courses based on certificate levels.
            Each record will use its own matched course where available.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {enableCourseMatching 
              ? "No course matches found. Please select a default course to use for all records."
              : "Select a course to apply to all certificates in this batch."}
          </p>
          
          <Select
            value={selectedCourseId || "none"}
            onValueChange={setSelectedCourseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                No course selected
              </SelectItem>
              {courses?.filter(c => c.status === 'ACTIVE').map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCourse && (
            <div className="flex gap-2 mt-2 text-xs">
              {selectedCourse.first_aid_level && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  FA: {selectedCourse.first_aid_level}
                </Badge>
              )}
              {selectedCourse.cpr_level && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  CPR: {selectedCourse.cpr_level}
                </Badge>
              )}
              {selectedCourse.expiration_months && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                  Expires: {selectedCourse.expiration_months} months
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
      
      {extractedCourse && extractedCourse.name && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle>Course information detected</AlertTitle>
          <AlertDescription className="text-sm">
            <p>We detected the following course information in your file:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {extractedCourse.name && (
                <div>
                  <span className="font-medium text-blue-700">Name:</span> {extractedCourse.name}
                </div>
              )}
              {extractedCourse.firstAidLevel && (
                <div>
                  <span className="font-medium text-blue-700">First Aid:</span> {extractedCourse.firstAidLevel}
                </div>
              )}
              {extractedCourse.cprLevel && (
                <div>
                  <span className="font-medium text-blue-700">CPR:</span> {extractedCourse.cprLevel}
                </div>
              )}
              {extractedCourse.length && (
                <div>
                  <span className="font-medium text-blue-700">Length:</span> {extractedCourse.length} hrs
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
