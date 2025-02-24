
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
import { transformTeamData } from "../utils/transformers"

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

      return (teamsData || []).map(team => transformTeamData(team))
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
