
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2,
  EyeIcon, 
  FileTextIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  SearchIcon,
  ChevronsUpDownIcon,
  PlusIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RosterWithRelations } from '@/types/roster';

interface RosterListProps {
  rosters: RosterWithRelations[];
  isLoading: boolean;
  onViewRoster: (roster: RosterWithRelations) => void;
  onAddNew: () => void;
}

export const RosterList: React.FC<RosterListProps> = ({ 
  rosters, 
  isLoading,
  onViewRoster,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  // Filter rosters by search term
  const filteredRosters = rosters?.filter(roster => 
    roster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.description && roster.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (roster.course?.name && roster.course.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (roster.location?.name && roster.location.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Sort rosters
  const sortedRosters = [...filteredRosters].sort((a, b) => {
    let valueA, valueB;
    
    if (sortBy === 'name') {
      valueA = a.name;
      valueB = b.name;
    } else if (sortBy === 'certificate_count') {
      valueA = a.certificate_count || 0;
      valueB = b.certificate_count || 0;
    } else if (sortBy === 'course') {
      valueA = a.course?.name || '';
      valueB = b.course?.name || '';
    } else if (sortBy === 'location') {
      valueA = a.location?.name || '';
      valueB = b.location?.name || '';
    } else {
      valueA = a.created_at;
      valueB = b.created_at;
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rosters..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={onAddNew} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" /> Create New Roster
        </Button>
      </div>

      {sortedRosters.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No rosters found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new roster'}
          </p>
          <Button onClick={onAddNew} className="mt-4">
            <PlusIcon className="h-4 w-4 mr-2" /> Create New Roster
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('name')}
                  >
                    <span>Name</span>
                    <ChevronsUpDownIcon className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('course')}
                  >
                    <span>Course</span>
                    <ChevronsUpDownIcon className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('location')}
                  >
                    <span>Location</span>
                    <ChevronsUpDownIcon className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('certificate_count')}
                  >
                    <span>Certificates</span>
                    <ChevronsUpDownIcon className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('created_at')}
                  >
                    <span>Date</span>
                    <ChevronsUpDownIcon className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRosters.map((roster) => (
                <TableRow key={roster.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{roster.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {roster.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {roster.course ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {roster.course.name}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {roster.location ? (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{roster.location.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {roster.certificate_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(roster.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        roster.status === 'PROCESSED' ? 'bg-green-50 text-green-700' :
                        roster.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                        roster.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' :
                        roster.status === 'ARCHIVED' ? 'bg-gray-50 text-gray-700' :
                        'bg-orange-50 text-orange-700'
                      }
                    >
                      {roster.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewRoster(roster)}>
                          <EyeIcon className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/certificates?roster=${roster.id}`)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> View Certificates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/certificates/new?roster=${roster.id}`)}>
                          <PlusIcon className="h-4 w-4 mr-2" /> Add Certificate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
