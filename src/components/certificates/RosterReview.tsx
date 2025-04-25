
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, Edit2, Save, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CourseMatchDisplay } from './batch-upload/CourseMatchDisplay';
import { useCourseData } from '@/hooks/useCourseData';
import { Input } from '@/components/ui/input';
import { useBatchUpload } from './batch-upload/BatchCertificateContext';
import type { RosterEntry } from './utils/rosterValidation';

interface RosterReviewProps {
  data: RosterEntry[];
  totalCount: number;
  errorCount: number;
  enableCourseMatching?: boolean;
}

export function RosterReview({ data, totalCount, errorCount, enableCourseMatching = true }: RosterReviewProps) {
  const [visibleDetails, setVisibleDetails] = useState<Record<number, boolean>>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RosterEntry>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const { data: coursesData, isLoading: coursesLoading } = useCourseData();
  const { updateEntry } = useBatchUpload();
  
  useEffect(() => {
    if (coursesData) {
      const activeCourses = coursesData.filter(c => c.status === 'ACTIVE');
      console.log('Active courses:', activeCourses);
      setCourses(activeCourses);
    }
  }, [coursesData]);

  const toggleDetails = (index: number) => {
    setVisibleDetails({
      ...visibleDetails,
      [index]: !visibleDetails[index]
    });
  };

  const handleCourseChange = (entryIndex: number, courseId: string) => {
    console.log(`Changing course for entry ${entryIndex} to course ${courseId}`);
    const selectedCourse = courses.find(c => c.id === courseId);
    if (selectedCourse) {
      console.log('Selected course:', selectedCourse);
      updateEntry(entryIndex, { 
        courseId,
        matchedCourse: {
          id: selectedCourse.id,
          name: selectedCourse.name,
          matchType: 'manual'
        }
      });
    }
  };

  const startEditing = (index: number) => {
    setEditingRow(index);
    setEditValues({
      studentName: data[index].studentName,
      email: data[index].email,
      phone: data[index].phone,
      company: data[index].company,
      city: data[index].city,
      province: data[index].province,
      postalCode: data[index].postalCode,
      firstAidLevel: data[index].firstAidLevel,
      cprLevel: data[index].cprLevel,
    });
  };

  const saveEdits = (index: number) => {
    // Validate email
    if (editValues.email && !isValidEmail(editValues.email)) {
      updateEntry(index, { 
        ...editValues,
        hasError: true,
        errors: ['Email format is invalid']
      });
    } else {
      // Check if this edit resolves any errors
      const updatedValues = { ...editValues };
      const currentEntry = data[index];
      
      // If we're fixing the only error, mark as not having an error
      if (currentEntry.hasError && 
          currentEntry.errors?.length === 1 && 
          currentEntry.errors[0].includes('Email')) {
        updatedValues.hasError = false;
        updatedValues.errors = [];
      }
      
      updateEntry(index, updatedValues);
    }
    
    setEditingRow(null);
    setEditValues({});
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  if (!data.length) return null;

  const hasErrors = errorCount > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">Roster Preview</h3>
          <Badge variant={hasErrors ? "destructive" : "default"} className="ml-2">
            {totalCount} Records
          </Badge>
          {hasErrors ? (
            <Badge variant="destructive">
              {errorCount} Issues
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Valid
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="h-[350px] rounded-md border">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[240px]">Student</TableHead>
                <TableHead className="hidden md:table-cell w-[200px]">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Certification</TableHead>
                <TableHead className="w-[220px]">Course Match</TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry, index) => (
                <React.Fragment key={index}>
                  <TableRow className={entry.hasError ? "bg-red-50 dark:bg-red-900/10" : ""}>
                    <TableCell>
                      {editingRow === index ? (
                        <Input 
                          value={editValues.studentName || ''} 
                          onChange={e => setEditValues({...editValues, studentName: e.target.value})}
                          className="mb-1"
                        />
                      ) : (
                        <div className="font-medium">{entry.studentName}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">Row {entry.rowIndex + 1}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {editingRow === index ? (
                        <div className="space-y-2">
                          <Input 
                            value={editValues.email || ''} 
                            onChange={e => setEditValues({...editValues, email: e.target.value})}
                            placeholder="Email"
                          />
                          <Input 
                            value={editValues.phone || ''} 
                            onChange={e => setEditValues({...editValues, phone: e.target.value})}
                            placeholder="Phone"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm">{entry.email}</div>
                          {entry.phone && <div className="text-xs text-muted-foreground">{entry.phone}</div>}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {editingRow === index ? (
                        <div className="space-y-2">
                          <Input 
                            value={editValues.firstAidLevel || ''} 
                            onChange={e => setEditValues({...editValues, firstAidLevel: e.target.value})}
                            placeholder="First Aid Level"
                          />
                          <Input 
                            value={editValues.cprLevel || ''} 
                            onChange={e => setEditValues({...editValues, cprLevel: e.target.value})}
                            placeholder="CPR Level"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          {entry.firstAidLevel && (
                            <Badge variant="outline" className="mr-2">
                              {entry.firstAidLevel}
                            </Badge>
                          )}
                          {entry.cprLevel && (
                            <Badge variant="outline">
                              {entry.cprLevel}
                            </Badge>
                          )}
                          {entry.length && (
                            <div className="text-xs text-muted-foreground">
                              Length: {entry.length} hours
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {enableCourseMatching && courses.length > 0 && (
                        <CourseMatchDisplay
                          entry={entry}
                          matchedCourse={entry.matchedCourse}
                          availableCourses={courses}
                          onCourseChange={(courseId) => handleCourseChange(index, courseId)}
                        />
                      )}
                      {!enableCourseMatching && (
                        <div className="text-sm text-muted-foreground">Course matching disabled</div>
                      )}
                      {enableCourseMatching && courses.length === 0 && !coursesLoading && (
                        <div className="text-sm text-red-500">No active courses available</div>
                      )}
                      {enableCourseMatching && courses.length === 0 && coursesLoading && (
                        <div className="text-sm text-muted-foreground">Loading courses...</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {editingRow === index ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => saveEdits(index)}
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={cancelEditing}
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => startEditing(index)}
                            title="Edit entry"
                            className="h-8 w-8" 
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {entry.hasError && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleDetails(index)} 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Show errors"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {visibleDetails[index] && entry.errors && entry.errors.length > 0 && (
                    <TableRow className="bg-red-50 dark:bg-red-900/10">
                      <TableCell colSpan={5} className="px-4 py-2">
                        <div className="text-sm text-red-600 pl-4 border-l-2 border-red-500">
                          <ul className="list-disc pl-4 space-y-1">
                            {entry.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
