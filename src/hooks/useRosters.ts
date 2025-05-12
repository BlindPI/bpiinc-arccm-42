
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRosters,
  fetchRosterById,
  fetchRosterCertificates,
  fetchRosterStatistics,
  createRoster,
  updateRoster,
  archiveRoster,
  deleteRoster,
  searchRosters
} from '@/services/rosterService';
import { CreateRosterData, RosterFilters, UpdateRosterData } from '@/types/rosters';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProfile } from './useProfile';

export function useRosters(filters?: Partial<RosterFilters>) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Fetch all rosters
  const { data: rosters = [], isLoading } = useQuery({
    queryKey: ['rosters', filters],
    queryFn: async () => {
      try {
        const data = await fetchRosters();
        
        // Apply client-side filtering
        let filteredData = data;
        
        if (filters) {
          // Filter by search term
          if (filters.search) {
            filteredData = filteredData.filter(roster => 
              roster.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
              (roster.description && roster.description.toLowerCase().includes(filters.search!.toLowerCase()))
            );
          }
          
          // Filter by status
          if (filters.status && filters.status !== 'all') {
            filteredData = filteredData.filter(roster => roster.status === filters.status);
          }
          
          // Filter by course ID
          if (filters.courseId) {
            filteredData = filteredData.filter(roster => roster.course_id === filters.courseId);
          }
          
          // Filter by location ID
          if (filters.locationId) {
            filteredData = filteredData.filter(roster => roster.location_id === filters.locationId);
          }
          
          // Filter by created by
          if (filters.createdBy) {
            filteredData = filteredData.filter(roster => roster.created_by === filters.createdBy);
          }
          
          // Filter by date range
          if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
            filteredData = filteredData.filter(roster => {
              const rosterDate = new Date(roster.created_at).getTime();
              let withinRange = true;
              
              if (filters.dateRange.from) {
                const fromDate = new Date(filters.dateRange.from).getTime();
                withinRange = withinRange && rosterDate >= fromDate;
              }
              
              if (filters.dateRange.to) {
                const toDate = new Date(filters.dateRange.to).getTime();
                withinRange = withinRange && rosterDate <= toDate;
              }
              
              return withinRange;
            });
          }
        }
        
        // Filter out rosters not created by the user if not admin
        if (!isAdmin) {
          filteredData = filteredData.filter(roster => roster.created_by === profile?.id);
        }
        
        return filteredData;
      } catch (error) {
        console.error('Error in useRosters:', error);
        toast.error('Failed to load rosters');
        return [];
      }
    },
    enabled: !!profile,
  });

  // Create a new roster
  const createRosterMutation = useMutation({
    mutationFn: (data: CreateRosterData) => createRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      toast.success('Roster created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating roster:', error);
      toast.error(`Failed to create roster: ${error.message}`);
    },
  });

  // Update a roster
  const updateRosterMutation = useMutation({
    mutationFn: (data: UpdateRosterData) => updateRoster(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      queryClient.invalidateQueries({ queryKey: ['roster', variables.id] });
      toast.success('Roster updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating roster:', error);
      toast.error(`Failed to update roster: ${error.message}`);
    },
  });

  // Archive a roster
  const archiveRosterMutation = useMutation({
    mutationFn: (rosterId: string) => archiveRoster(rosterId),
    onSuccess: (_, rosterId) => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      queryClient.invalidateQueries({ queryKey: ['roster', rosterId] });
      toast.success('Roster archived successfully');
    },
    onError: (error: Error) => {
      console.error('Error archiving roster:', error);
      toast.error(`Failed to archive roster: ${error.message}`);
    },
  });

  // Delete a roster
  const deleteRosterMutation = useMutation({
    mutationFn: (rosterId: string) => deleteRoster(rosterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      toast.success('Roster deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting roster:', error);
      toast.error(`Failed to delete roster: ${error.message}`);
    },
  });

  return {
    rosters,
    isLoading,
    createRoster: createRosterMutation.mutate,
    updateRoster: updateRosterMutation.mutate,
    archiveRoster: archiveRosterMutation.mutate,
    deleteRoster: deleteRosterMutation.mutate,
    isCreating: createRosterMutation.isPending,
    isUpdating: updateRosterMutation.isPending,
    isArchiving: archiveRosterMutation.isPending,
    isDeleting: deleteRosterMutation.isPending,
  };
}

export function useRosterDetail(rosterId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch a single roster by ID
  const { data: roster, isLoading } = useQuery({
    queryKey: ['roster', rosterId],
    queryFn: () => fetchRosterById(rosterId!),
    enabled: !!rosterId,
  });

  // Fetch certificates for a roster
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['roster-certificates', rosterId],
    queryFn: () => fetchRosterCertificates(rosterId!),
    enabled: !!rosterId,
  });

  // Fetch roster statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['roster-statistics', rosterId],
    queryFn: () => fetchRosterStatistics(rosterId!),
    enabled: !!rosterId,
  });

  return {
    roster,
    certificates,
    statistics,
    isLoading,
    isLoadingCertificates,
    isLoadingStats,
  };
}

export function useRosterSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchRosters(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    performSearch,
    searchResults,
    isSearching,
  };
}
