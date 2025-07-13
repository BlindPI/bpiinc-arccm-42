import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamFilterProps {
  selectedTeamId?: string;
  onTeamChange: (teamId?: string) => void;
  locationId?: string;
}

export const TeamFilter: React.FC<TeamFilterProps> = ({
  selectedTeamId,
  onTeamChange,
  locationId
}) => {
  const { data: teams } = useQuery({
    queryKey: ['teams-for-filtering', locationId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('id, name, team_type')
        .eq('status', 'active')
        .order('name');

      // Filter by location if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTeamId || 'all'} onValueChange={(value) => onTeamChange(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams?.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} ({team.team_type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};