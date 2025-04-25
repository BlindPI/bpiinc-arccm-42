
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
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CourseMatchDisplay } from './batch-upload/CourseMatchDisplay';
import { useCourseData } from '@/hooks/useCourseData';
import type { RosterEntry } from './utils/rosterValidation';

interface RosterReviewProps {
  data: RosterEntry[];
  totalCount: number;
  errorCount: number;
}

export function RosterReview({ data, totalCount, errorCount }: RosterReviewProps) {
  const [visibleDetails, setVisibleDetails] = useState<Record<number, boolean>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const { data: coursesData } = useCourseData();
  
  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData.filter(c => c.status === 'ACTIVE'));
    }
  }, [coursesData]);

  const toggleDetails = (index: number) => {
    setVisibleDetails({
      ...visibleDetails,
      [index]: !visibleDetails[index]
    });
  };

  const handleCourseChange = (entryIndex: number, courseId: string) => {
    // In a real implementation, this would update the entry's courseId
    console.log('Changed course for entry', entryIndex, 'to', courseId);
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
                <TableHead className="w-[80px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry, index) => (
                <React.Fragment key={index}>
                  <TableRow className={entry.hasError ? "bg-red-50 dark:bg-red-900/10" : ""}>
                    <TableCell>
                      <div className="font-medium">{entry.studentName}</div>
                      <div className="text-xs text-muted-foreground mt-1">Row {entry.rowIndex + 1}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{entry.email}</div>
                      {entry.phone && <div className="text-xs text-muted-foreground">{entry.phone}</div>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
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
                    </TableCell>
                    <TableCell>
                      {courses.length > 0 && (
                        <CourseMatchDisplay
                          entry={entry}
                          matchedCourse={entry.matchedCourse}
                          availableCourses={courses}
                          onCourseChange={(courseId) => handleCourseChange(index, courseId)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {entry.hasError ? (
                          <button 
                            onClick={() => toggleDetails(index)} 
                            className="p-1 hover:bg-red-100 rounded-full"
                            title="Show errors"
                          >
                            <XCircle className="h-5 w-5 text-red-600" />
                          </button>
                        ) : (
                          entry.matchedCourse?.matchType === 'exact' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )
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
