
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourseData } from '@/hooks/useCourseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, MoveRight, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocationData } from '@/hooks/useLocationData';
import { useBatchUpload } from './batch-upload/BatchCertificateContext';
import { ExtractedCourseInfo } from './batch-upload/BatchCertificateContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RosterReviewProps {
  data: any[];
  enableCourseMatching?: boolean;
  selectedCourseId?: string;
  extractedCourse?: ExtractedCourseInfo | null;
  totalCount?: number;
  errorCount?: number;
}

export function RosterReview({
  data,
  totalCount,
  errorCount,
  enableCourseMatching = false,
  selectedCourseId,
  extractedCourse,
}: RosterReviewProps) {
  const [sortField, setSortField] = useState<string>('rowNum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const { data: courses } = useCourseData();
  const { locations } = useLocationData();
  const { selectedLocationId } = useBatchUpload();
  
  const rowsPerPage = 10;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row => {
    const matchesSearch = search === '' || 
      (row.name && row.name.toLowerCase().includes(search.toLowerCase())) ||
      (row.email && row.email.toLowerCase().includes(search.toLowerCase()));
    
    if (showErrors) {
      return matchesSearch && (row.error || !row.isProcessed);
    }
    
    return matchesSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortField] === b[sortField]) return 0;
    
    if (a[sortField] === null || a[sortField] === undefined) return 1;
    if (b[sortField] === null || b[sortField] === undefined) return -1;
    
    const aVal = typeof a[sortField] === 'string' ? a[sortField].toLowerCase() : a[sortField];
    const bVal = typeof b[sortField] === 'string' ? b[sortField].toLowerCase() : b[sortField];
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : 1;
    } else {
      return aVal > bVal ? -1 : 1;
    }
  });

  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const formatCourseName = (courseId: string) => {
    if (!courses) return courseId;
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : courseId;
  };

  const formatLocationName = (locationId: string) => {
    if (!locations) return 'Unknown Location';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-medium">
          Roster Review: {totalCount} Records {errorCount ? `(${errorCount} with errors)` : ''}
        </h3>
        
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto"
          />
          
          <Button
            variant={showErrors ? "destructive" : "outline"}
            onClick={() => setShowErrors(!showErrors)}
            size="sm"
          >
            {showErrors ? "Show All" : "Show Errors"}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-x-auto bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('rowNum')}
                  className="px-1"
                >
                  #
                  {sortField === 'rowNum' && (
                    sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4 ml-1" /> : <ArrowDown className="inline h-4 w-4 ml-1" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="px-1 text-left"
                >
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4 ml-1" /> : <ArrowDown className="inline h-4 w-4 ml-1" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('email')}
                  className="px-1 text-left"
                >
                  Email
                  {sortField === 'email' && (
                    sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4 ml-1" /> : <ArrowDown className="inline h-4 w-4 ml-1" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Course Info</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-center">{row.rowNum}</TableCell>
                <TableCell>{row.name || '—'}</TableCell>
                <TableCell>{row.email || '—'}</TableCell>
                <TableCell>{row.issueDate || '—'}</TableCell>
                <TableCell>
                  {enableCourseMatching && row.courseMatches && row.courseMatches[0] ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              {row.firstAidLevel && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                                  {row.firstAidLevel}
                                </span>
                              )}
                              {row.firstAidLevel && row.cprLevel && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                              {row.cprLevel && (
                                <span className="text-xs bg-green-50 text-green-700 px-1 py-0.5 rounded">
                                  {row.cprLevel}
                                </span>
                              )}
                              {(row.firstAidLevel || row.cprLevel) && (
                                <MoveRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="font-medium flex items-center gap-1">
                                {row.courseMatches[0].courseName}
                                <Badge variant={
                                  row.courseMatches[0].matchType === 'exact' ? 'success' :
                                  row.courseMatches[0].matchType === 'partial' ? 'warning' :
                                  row.courseMatches[0].matchType === 'manual' ? 'outline' : 'secondary'
                                } className="text-[10px]">
                                  {row.courseMatches[0].matchType}
                                </Badge>
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold">Match details:</p>
                            <p>Match type: {row.courseMatches[0].matchType}</p>
                            <p>Confidence: {row.courseMatches[0].confidence}%</p>
                            {row.courseMatches[0].certifications && row.courseMatches[0].certifications.length > 0 && (
                              <div>
                                <p>Certifications:</p>
                                <ul className="list-disc pl-4">
                                  {row.courseMatches[0].certifications.map((cert: any, i: number) => (
                                    <li key={i}>{cert.type}: {cert.level}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : selectedCourseId && selectedCourseId !== 'none' ? (
                    <span className="text-sm font-medium">
                      {formatCourseName(selectedCourseId)}
                      <Badge variant="outline" className="ml-2 text-[10px]">manual</Badge>
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      {row.firstAidLevel || row.cprLevel || 'No course info'}
                    </span>
                  )}
                  
                  {/* Show location if selected */}
                  {selectedLocationId && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Location: {formatLocationName(selectedLocationId)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.error ? (
                    <Badge variant="destructive" className="ml-auto">Error</Badge>
                  ) : row.isProcessed ? (
                    <Badge variant="success" className="ml-auto">OK</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto">Pending</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
          </div>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {showErrors && errorCount && errorCount > 0 && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-sm space-y-2">
          <h4 className="font-medium text-red-800">Error Details</h4>
          {paginatedData
            .filter(row => row.error)
            .map((row, index) => (
              <div key={index} className="flex gap-2 text-red-700">
                <div className="font-medium">Row {row.rowNum}:</div>
                <div>{row.error}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
