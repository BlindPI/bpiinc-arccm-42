
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeamContext } from '../useTeamContext';

export function useTeamMetrics() {
  const { primaryTeam, shouldUseTeamDashboard } = useTeamContext();

  return useQuery({
    queryKey: ['team-metrics', primaryTeam?.team_id],
    queryFn: async () => {
      if (!primaryTeam?.team_id) return null;

      // Get team-specific metrics
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*')
        .eq('location_id', primaryTeam.teams?.location_id);

      const { data: courses } = await supabase
        .from('course_offerings')
        .select('*')
        .eq('location_id', primaryTeam.teams?.location_id);

      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*, profiles(*)')
        .eq('team_id', primaryTeam.team_id);

      return {
        totalCertificates: certificates?.length || 0,
        activeCourses: courses?.filter(c => c.status === 'SCHEDULED').length || 0,
        teamSize: teamMembers?.length || 0,
        teamPerformance: primaryTeam.teams?.performance_score || 0,
        locationName: primaryTeam.teams?.locations?.name || 'Unknown Location'
      };
    },
    enabled: !!primaryTeam?.team_id && shouldUseTeamDashboard
  });
}

export function useTeamCourses() {
  const { primaryTeam, shouldUseTeamDashboard } = useTeamContext();

  return useQuery({
    queryKey: ['team-courses', primaryTeam?.teams?.location_id],
    queryFn: async () => {
      if (!primaryTeam?.teams?.location_id) return [];

      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          *,
          courses(*),
          profiles(display_name)
        `)
        .eq('location_id', primaryTeam.teams.location_id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!primaryTeam?.teams?.location_id && shouldUseTeamDashboard
  });
}

export function useTeamCertificates() {
  const { primaryTeam, shouldUseTeamDashboard } = useTeamContext();

  return useQuery({
    queryKey: ['team-certificates', primaryTeam?.teams?.location_id],
    queryFn: async () => {
      if (!primaryTeam?.teams?.location_id) return [];

      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('location_id', primaryTeam.teams.location_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!primaryTeam?.teams?.location_id && shouldUseTeamDashboard
  });
}
