
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  GraduationCap, 
  User, 
  Calendar,
  MoreHorizontal,
  Download,
  Eye
} from 'lucide-react';
import { EnhancedCertificateRequest } from '@/types/certificateValidation';
import { DetailedRequestCard } from './DetailedRequestCard';
import { BulkActionBar } from './BulkActionBar';
import { RequestDetailsModal } from './RequestDetailsModal';
import { useProfile } from '@/hooks/useProfile';

interface EnhancedPendingRequestsViewProps {
  requests: EnhancedCertificateRequest[];
  onApprove: (requestIds: string[]) => void;
  onReject: (requestIds: string[], reason: string) => void;
  isLoading?: boolean;
}

export function EnhancedPendingRequestsView({
  requests,
  onApprove,
  onReject,
  isLoading = false
}: EnhancedPendingRequestsViewProps) {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterAssessment, setFilterAssessment] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'course' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Get unique values for filters
  const locations = useMemo(() => 
    [...new Set(requests.map(r => r.locationName).filter(Boolean))], [requests]
  );
  const courses = useMemo(() => 
    [...new Set(requests.map(r => r.courseName).filter(Boolean))], [requests]
  );
  
  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(request => {
      const matchesSearch = !searchQuery || 
        request.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.courseName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = !filterLocation || request.locationName === filterLocation;
      const matchesCourse = !filterCourse || request.courseName === filterCourse;
      const matchesAssessment = !filterAssessment || request.assessmentStatus === filterAssessment;
      
      return matchesSearch && matchesLocation && matchesCourse && matchesAssessment;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.recipientName.localeCompare(b.recipientName);
          break;
        case 'course':
          comparison = a.courseName.localeCompare(b.courseName);
          break;
        case 'location':
          comparison = a.locationName.localeCompare(b.locationName);
          break;
        case 'date':
        default:
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [requests, searchQuery, filterLocation, filterCourse, filterAssessment, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const approvableRequests = filteredAndSortedRequests
        .filter(r => r.assessmentStatus !== 'FAIL')
        .map(r => r.id);
      setSelectedRequests(approvableRequests);
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleBulkApprove = () => {
    if (selectedRequests.length > 0) {
      onApprove(selectedRequests);
      setSelectedRequests([]);
    }
  };

  const handleBulkReject = (reason: string) => {
    if (selectedRequests.length > 0) {
      onReject(selectedRequests, reason);
      setSelectedRequests([]);
    }
  };

  const approvableRequests = filteredAndSortedRequests.filter(r => r.assessmentStatus !== 'FAIL');
  const failedRequests = filteredAndSortedRequests.filter(r => r.assessmentStatus === 'FAIL');

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approvable</p>
                <p className="text-2xl font-bold text-green-600">{approvableRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Failed Assessments</p>
                <p className="text-2xl font-bold text-red-600">{failedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{filteredAndSortedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-purple-600">{selectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location {filterLocation && `(${filterLocation})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterLocation('')}>
                    All Locations
                  </DropdownMenuItem>
                  {locations.map(location => (
                    <DropdownMenuItem key={location} onClick={() => setFilterLocation(location)}>
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Course {filterCourse && `(${filterCourse})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterCourse('')}>
                    All Courses
                  </DropdownMenuItem>
                  {courses.map(course => (
                    <DropdownMenuItem key={course} onClick={() => setFilterCourse(course)}>
                      {course}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Assessment {filterAssessment && `(${filterAssessment})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterAssessment('')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterAssessment('PASS')}>
                    Pass
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterAssessment('FAIL')}>
                    Fail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterAssessment('PENDING')}>
                    Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {canManageRequests && selectedRequests.length > 0 && (
        <BulkActionBar
          selectedCount={selectedRequests.length}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onClear={() => setSelectedRequests([])}
        />
      )}

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Certificate Requests ({filteredAndSortedRequests.length})</CardTitle>
            
            {canManageRequests && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRequests.length === approvableRequests.length && approvableRequests.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All Approvable</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAndSortedRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No certificate requests match your current filters.
            </div>
          ) : (
            <div className="divide-y">
              {filteredAndSortedRequests.map((request) => (
                <DetailedRequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedRequests.includes(request.id)}
                  onSelect={(checked) => handleSelectRequest(request.id, checked)}
                  onViewDetails={() => setSelectedRequestId(request.id)}
                  canManage={canManageRequests}
                  onApprove={() => onApprove([request.id])}
                  onReject={(reason) => onReject([request.id], reason)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequestId && (
        <RequestDetailsModal
          requestId={selectedRequestId}
          isOpen={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onApprove={() => {
            onApprove([selectedRequestId]);
            setSelectedRequestId(null);
          }}
          onReject={(reason) => {
            onReject([selectedRequestId], reason);
            setSelectedRequestId(null);
          }}
          canManage={canManageRequests}
        />
      )}
    </div>
  );
}
