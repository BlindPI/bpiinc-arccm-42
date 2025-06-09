import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthorizedProviderService } from '@/services/provider/authorizedProviderService';
import { TeamManagementService } from '@/services/team/teamManagementService';

// Define the component's props interface
interface ProviderTeamAssignmentsProps {
  providerId: string;
}

export function ProviderTeamAssignments({ providerId }: { providerId: string }) {
  const { data: provider } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => AuthorizedProviderService.getProviderById(providerId)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['provider-teams', providerId],
    queryFn: () => TeamManagementService.getProviderTeams(providerId)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Assignments for {provider?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length > 0 ? (
          <ul>
            {teams.map((team) => (
              <li key={team.id} className="py-2 border-b">
                {team.name} - {team.team_type}
              </li>
            ))}
          </ul>
        ) : (
          <p>No teams assigned to this provider.</p>
        )}
      </CardContent>
    </Card>
  );
}
