
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RosterWithRelations, RosterFilters } from '@/types/rosters';
import { RosterCard } from './RosterCard';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { Button } from '@/components/ui/button';
import { RosterFiltersBar } from './RosterFiltersBar';
import { PlusCircle, Layers } from 'lucide-react';

interface RosterListProps {
  rosters: RosterWithRelations[];
  isLoading: boolean;
  onArchiveRoster: (rosterId: string) => void;
}

export function RosterList({ rosters, isLoading, onArchiveRoster }: RosterListProps) {
  const navigate = useNavigate();
  const { generateCertificatesZip } = useCertificateOperations();
  const [filters, setFilters] = React.useState<RosterFilters>({
    search: '',
    status: 'all',
    dateRange: { from: null, to: null },
    courseId: null,
    locationId: null,
    createdBy: null
  });

  // Apply client-side filtering
  const filteredRosters = React.useMemo(() => {
    let result = rosters;
    
    if (filters.search) {
      result = result.filter(roster => 
        roster.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (roster.description && roster.description.toLowerCase().includes(filters.search.toLowerCase())) ||
        (roster.course?.name && roster.course.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (roster.location?.name && roster.location.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }
    
    if (filters.status !== 'all') {
      result = result.filter(roster => roster.status === filters.status);
    }
    
    if (filters.courseId) {
      result = result.filter(roster => roster.course_id === filters.courseId);
    }
    
    if (filters.locationId) {
      result = result.filter(roster => roster.location_id === filters.locationId);
    }
    
    if (filters.dateRange.from || filters.dateRange.to) {
      result = result.filter(roster => {
        const rosterDate = new Date(roster.created_at);
        
        if (filters.dateRange.from && new Date(filters.dateRange.from) > rosterDate) {
          return false;
        }
        
        if (filters.dateRange.to) {
          // Set to end of day
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (toDate < rosterDate) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    return result;
  }, [rosters, filters]);

  const handleFilterChange = (newFilters: Partial<RosterFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateRange: { from: null, to: null },
      courseId: null,
      locationId: null,
      createdBy: null
    });
  };

  const handleViewRoster = (rosterId: string) => {
    navigate(`/rosters/${rosterId}`);
  };

  const handleDownloadRosterCertificates = async (rosterId: string) => {
    // Find the selected roster
    const roster = rosters.find(r => r.id === rosterId);
    if (!roster) return;
    
    // Fetch certificates for this roster
    const { data, error } = await supabase
      .from('certificates')
      .select('id')
      .eq('roster_id', rosterId);
    
    if (error) {
      console.error('Error fetching certificates for download:', error);
      toast.error('Failed to fetch certificates for download');
      return;
    }
    
    if (!data.length) {
      toast.error('No certificates found in this roster');
      return;
    }
    
    // Extract certificate IDs and generate the ZIP
    const certificateIds = data.map(cert => cert.id);
    await generateCertificatesZip(certificateIds, roster.name);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Layers className="h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="mt-4 text-muted-foreground">Loading rosters...</p>
      </div>
    );
  }

  if (!rosters.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
        <Layers className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 font-medium text-lg">No rosters found</h3>
        <p className="text-muted-foreground mt-1">Create your first roster to get started</p>
        <Button 
          className="mt-6" 
          onClick={() => navigate('/certificates/upload')}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Roster
        </Button>
      </div>
    );
  }

  return (
    <div>
      <RosterFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      {filteredRosters.length === 0 ? (
        <div className="bg-muted/20 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No rosters match your filter criteria</p>
          <Button 
            variant="link" 
            onClick={resetFilters}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRosters.map(roster => (
            <RosterCard
              key={roster.id}
              roster={roster}
              onView={handleViewRoster}
              onArchive={onArchiveRoster}
              onDownload={handleDownloadRosterCertificates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
