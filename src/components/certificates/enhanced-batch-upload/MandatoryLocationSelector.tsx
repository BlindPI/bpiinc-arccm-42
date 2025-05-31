
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, GraduationCap, Calendar, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MandatoryLocationSelectorProps {
  selectedLocationId: string;
  onLocationSelect: (locationId: string) => void;
  selectedCourseId: string;
  onCourseSelect: (courseId: string) => void;
  issueDate: string;
  onIssueDateChange: (date: string) => void;
}

export function MandatoryLocationSelector({
  selectedLocationId,
  onLocationSelect,
  selectedCourseId,
  onCourseSelect,
  issueDate,
  onIssueDateChange
}: MandatoryLocationSelectorProps) {
  
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const isFormValid = selectedLocationId && selectedCourseId && issueDate;

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>All fields below are mandatory.</strong> Location selection is required to ensure proper certificate tracking and compliance.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Location Selection */}
        <Card className={`transition-all ${selectedLocationId ? 'ring-2 ring-green-500 bg-green-50' : 'border-red-300'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Location *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locations.length === 0 ? (
              <Alert variant="destructive">
                <AlertDescription>No active locations found. Please contact an administrator.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => (
                  <Button
                    key={location.id}
                    variant={selectedLocationId === location.id ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => onLocationSelect(location.id)}
                  >
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.city}, {location.state}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            {!selectedLocationId && (
              <p className="text-xs text-red-600 mt-2">
                Location selection is mandatory for all certificates
              </p>
            )}
          </CardContent>
        </Card>

        {/* Course Selection */}
        <Card className={`transition-all ${selectedCourseId ? 'ring-2 ring-green-500 bg-green-50' : 'border-red-300'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4" />
              Course *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.length === 0 ? (
              <Alert variant="destructive">
                <AlertDescription>No active courses found. Please contact an administrator.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {courses.map((course) => (
                  <Button
                    key={course.id}
                    variant={selectedCourseId === course.id ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => onCourseSelect(course.id)}
                  >
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.expiration_months} months validity
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            {!selectedCourseId && (
              <p className="text-xs text-red-600 mt-2">
                Course selection is required
              </p>
            )}
          </CardContent>
        </Card>

        {/* Issue Date */}
        <Card className={`transition-all ${issueDate ? 'ring-2 ring-green-500 bg-green-50' : 'border-red-300'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Issue Date *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="issueDate" className="text-sm font-medium">
                Certificate Issue Date
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => onIssueDateChange(e.target.value)}
                className={`mt-1 ${!issueDate ? 'border-red-300' : 'border-green-300'}`}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              {!issueDate && (
                <p className="text-xs text-red-600 mt-1">
                  Issue date is required
                </p>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Note:</strong> All certificates in this batch will use this issue date.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      <div className={`p-4 rounded-lg border ${isFormValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {isFormValid ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">Ready to proceed</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-800 font-medium">Complete all required fields</span>
            </>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {isFormValid 
            ? "All mandatory fields are selected. You can now proceed to file upload."
            : "Please select a location, course, and issue date before proceeding."
          }
        </div>
      </div>
    </div>
  );
}
