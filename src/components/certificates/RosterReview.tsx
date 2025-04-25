
import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { findMatchingCourse } from "./utils/courseMatching";
import { useCourseData } from "@/hooks/useCourseData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RosterEntry {
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  hasError: boolean;
  errors?: string[];
  rowIndex: number;
  courseId: string;
  matchedCourse?: {
    id: string;
    name: string;
    matchType: 'exact' | 'partial' | 'default';
  };
}

interface RosterReviewProps {
  data: RosterEntry[];
  totalCount: number;
  errorCount: number;
  enableCourseMatching?: boolean;
}

export function RosterReview({ data, totalCount, errorCount, enableCourseMatching = false }: RosterReviewProps) {
  const { data: courses } = useCourseData();
  const [processedEntries, setProcessedEntries] = useState<RosterEntry[]>(data);
  const [isMatchingCourses, setIsMatchingCourses] = useState(false);
  const [matchedCount, setMatchedCount] = useState({ exact: 0, partial: 0, default: 0 });

  // Find the course name for the given ID
  const getCourseNameById = (id: string) => {
    const course = courses?.find(c => c.id === id);
    return course?.name || "Unknown Course";
  };

  // Process course matching when enabled
  useEffect(() => {
    if (!enableCourseMatching || !data.length || !data[0].courseId) return;
    
    const defaultCourseId = data[0].courseId;
    
    async function matchCourses() {
      setIsMatchingCourses(true);
      
      const updatedEntries = [...data];
      let exactMatches = 0;
      let partialMatches = 0;
      let defaultMatches = 0;
      
      for (let i = 0; i < updatedEntries.length; i++) {
        const entry = updatedEntries[i];
        
        // Skip entries with errors
        if (entry.hasError) continue;
        
        try {
          const match = await findMatchingCourse(
            entry.firstAidLevel,
            entry.cprLevel,
            defaultCourseId
          );
          
          if (match) {
            entry.courseId = match.id;
            entry.matchedCourse = {
              id: match.id,
              name: match.name,
              matchType: match.matchType,
            };
            
            // Count match types
            if (match.matchType === 'exact') exactMatches++;
            else if (match.matchType === 'partial') partialMatches++;
            else defaultMatches++;
          }
        } catch (error) {
          console.error('Error matching course for entry:', error);
        }
      }
      
      setMatchedCount({
        exact: exactMatches,
        partial: partialMatches,
        default: defaultMatches
      });
      
      setProcessedEntries(updatedEntries);
      setIsMatchingCourses(false);
    }
    
    matchCourses();
  }, [data, enableCourseMatching, courses]);

  const columns: ColumnDef<RosterEntry>[] = [
    {
      accessorKey: "studentName",
      header: "Student Name",
      cell: ({ row }) => {
        const hasError = row.original.hasError;
        return (
          <div className="flex items-center gap-2">
            {hasError ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            <span className={hasError ? "text-destructive" : ""}>{row.getValue("studentName")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "firstAidLevel",
      header: "First Aid Level",
    },
    {
      accessorKey: "cprLevel",
      header: "CPR Level",
    },
    // Only show matched course column if course matching is enabled
    ...(enableCourseMatching ? [{
      id: "matchedCourse",
      header: "Matched Course",
      cell: ({ row }) => {
        const entry = row.original;
        const matchedCourse = entry.matchedCourse;
        
        if (!matchedCourse) {
          return <span className="text-muted-foreground text-sm">Using default</span>;
        }
        
        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={
                      matchedCourse.matchType === 'exact' ? 'default' : 
                      matchedCourse.matchType === 'partial' ? 'outline' : 'secondary'
                    }
                  >
                    {matchedCourse.matchType === 'exact' ? 'Exact' : 
                     matchedCourse.matchType === 'partial' ? 'Partial' : 'Default'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {matchedCourse.matchType === 'exact' ? 
                    'Exact match on both First Aid and CPR Level' : 
                   matchedCourse.matchType === 'partial' ? 
                    'Partial match on either First Aid or CPR Level' : 
                    'Using default course (no match found)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm">{matchedCourse.name}</span>
          </div>
        );
      },
    }] : []),
    {
      accessorKey: "assessmentStatus",
      header: "Assessment Status",
      cell: ({ row }) => {
        const status = row.getValue("assessmentStatus") as string;
        return status ? (
          <Badge variant={status.toUpperCase() === "PASS" ? "success" : "destructive"}>
            {status}
          </Badge>
        ) : null;
      },
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "province",
      header: "Province",
    },
    {
      accessorKey: "postalCode",
      header: "Postal Code",
    },
    {
      id: "errors",
      header: "Issues",
      cell: ({ row }) => {
        const errors = row.original.errors;
        if (!errors?.length) return null;
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{errors.join(", ")}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valid Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{totalCount - errorCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Records with Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      {enableCourseMatching && !isMatchingCourses && (
        <div className="bg-muted/40 p-4 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Course Matching Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Badge variant="default" className="mb-1">Exact Matches</Badge>
              <p className="text-sm">{matchedCount.exact} records</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Partial Matches</Badge>
              <p className="text-sm">{matchedCount.partial} records</p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">Default Course</Badge>
              <p className="text-sm">{matchedCount.default} records</p>
            </div>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {errorCount} record{errorCount > 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} attention. 
            Please review and correct the issues before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <DataTable columns={columns} data={enableCourseMatching ? processedEntries : data} />
      </div>
    </div>
  );
}
