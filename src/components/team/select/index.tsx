
"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Team } from "@/types/user-management"

interface TeamSelectorProps {
  selectedTeamId: string
  onTeamSelect: (teamId: string) => void
}

export function TeamSelector({ selectedTeamId, onTeamSelect }: TeamSelectorProps) {
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      if (error) throw error

      return (teamsData || []).map(team => ({
        ...team,
        description: team.description || null,
        metadata: team.metadata || { visibility: 'private' }
      })) as Team[]
    }
  })

  return (
    <Select value={selectedTeamId} onValueChange={onTeamSelect}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a team" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          {teams?.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
