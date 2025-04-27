
import React, { useEffect } from 'react';
import { useCourseData } from '@/hooks/useCourseData';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';

interface StepReviewProps {
  recipientName: string;
  email: string;
  phone: string;
  company: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  selectedCourseId: string;
  locationId?: string;
  issueDate: string;
  expiryDate: string;
  city: string;
  province: string;
  postalCode: string;
  isValidated: boolean;
  setIsValidated: (value: boolean) => void;
}

export function StepReview({
  recipientName,
  email,
  phone,
  company,
  firstAidLevel,
  cprLevel,
  assessmentStatus,
  selectedCourseId,
  locationId,
  issueDate,
  expiryDate,
  city,
  province,
  postalCode,
  isValidated,
  setIsValidated
}: StepReviewProps) {
  const { data: courses, isLoading: isLoadingCourses } = useCourseData();
  const { locations, isLoading: isLoadingLocations } = useLocationData();

  // Find selected course and location
  const selectedCourse = selectedCourseId ? courses?.find(course => course.id === selectedCourseId) : null;
  const selectedLocation = locationId ? locations?.find(location => location.id === locationId) : null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Review Information</h3>
      <p className="text-sm text-muted-foreground">Please review all the information before submitting.</p>
      
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary">Personal Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Name:</div>
            <div>{recipientName}</div>
            
            <div className="text-muted-foreground">Email:</div>
            <div>{email}</div>
            
            {phone && (
              <>
                <div className="text-muted-foreground">Phone:</div>
                <div>{phone}</div>
              </>
            )}
            
            {company && (
              <>
                <div className="text-muted-foreground">Company/Organization:</div>
                <div>{company}</div>
              </>
            )}
            
            {city && (
              <>
                <div className="text-muted-foreground">City:</div>
                <div>{city}</div>
              </>
            )}
            
            {province && (
              <>
                <div className="text-muted-foreground">Province/State:</div>
                <div>{province}</div>
              </>
            )}
            
            {postalCode && (
              <>
                <div className="text-muted-foreground">Postal/Zip Code:</div>
                <div>{postalCode}</div>
              </>
            )}
          </div>
        </div>
        
        {/* Course Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary">Course Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Course:</div>
            <div>
              {isLoadingCourses ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  <span>Loading...</span>
                </div>
              ) : selectedCourse ? (
                selectedCourse.name
              ) : (
                <span className="text-red-500">No course selected</span>
              )}
            </div>
            
            {/* Location */}
            {locationId && (
              <>
                <div className="text-muted-foreground">Location:</div>
                <div>
                  {isLoadingLocations ? (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      <span>Loading...</span>
                    </div>
                  ) : selectedLocation ? (
                    selectedLocation.name
                  ) : (
                    <span className="text-red-500">No location selected</span>
                  )}
                </div>
              </>
            )}
            
            <div className="text-muted-foreground">First Aid Level:</div>
            <div>{firstAidLevel || 'Not specified'}</div>
            
            <div className="text-muted-foreground">CPR Level:</div>
            <div>{cprLevel || 'Not specified'}</div>
            
            <div className="text-muted-foreground">Assessment Status:</div>
            <div>
              {assessmentStatus ? (
                <Badge variant={assessmentStatus === 'PASS' ? 'success' : assessmentStatus === 'FAIL' ? 'destructive' : 'outline'}>
                  {assessmentStatus}
                </Badge>
              ) : (
                'Not specified'
              )}
            </div>
          </div>
        </div>
        
        {/* Date Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary">Certificate Dates</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Issue Date:</div>
            <div>{issueDate}</div>
            
            <div className="text-muted-foreground">Expiry Date:</div>
            <div>{expiryDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
