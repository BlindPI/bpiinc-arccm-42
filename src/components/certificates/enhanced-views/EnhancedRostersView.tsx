
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Calendar,
  MapPin,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { RosterWithRelations } from '@/types/roster';
import { EnhancedRosterCard } from './EnhancedRosterCard';
import { RosterStatsCards } from './RosterStatsCards';

export function EnhancedRostersView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: rosters, isLoading } = useQuery({
    queryKey: ['enhanced-rosters', isAdmin, statusFilter, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('rosters')
        .select(`
          *,
          course:courses(id, name, description),
          location:locations(id, name, address, city, state_province, country, postal_code),
          creator:profiles(id, display_name, email)
        `);

      if (!isAdmin && profile?.id) {
        query = query.eq('created_by', profile.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RosterWithRelations[];
    },
    enabled: !!profile
  });

  const filteredRosters = rosters?.filter(roster => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      roster.name?.toLowerCase().includes(searchLower) ||
      roster.course?.name?.toLowerCase().includes(searchLower) ||
      roster.location?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <RosterStatsCards rosters={rosters || []} />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced Roster Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rosters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              {['ACTIVE', 'ARCHIVED', 'DRAFT'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {isAdmin && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Roster
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rosters List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading rosters...</div>
          ) : filteredRosters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rosters found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRosters.map((roster) => (
                <EnhancedRosterCard
                  key={roster.id}
                  roster={roster}
                  canManage={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
