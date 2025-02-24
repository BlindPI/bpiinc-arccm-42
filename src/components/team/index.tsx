
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"
import { useToast } from "../ui/use-toast"
import { Database } from "@/integrations/supabase/types"

type TeamMember = Database['public']['Tables']['team_members']['Row'] & {
  user: {
    display_name: string | null;
  } | null;
  display_name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function Team() {
  const [team, setTeam] = useState<Team>({
    name: "Team",
    id: 'YOUR_TEAM_ID_TO_TEST'
  })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team.id)
        .single()

      if (teamError) throw teamError
      
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(`
          *,
          user:profiles!team_members_user_id_fkey(
            display_name
          )
        `)
        .eq("team_id", team.id)

      if (memberError) throw memberError

      // Transform the data to match the expected format
      const transformedMembers = (memberData || []).map(member => ({
        ...member,
        display_name: member.user?.display_name || 'Unknown'
      }))

      setTeam(teamData)
      setMembers(transformedMembers as TeamMember[])
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error fetching team data",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()

    const subscription = supabase
      .channel('channel_team_members')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${team.id}`
      }, () => {
        fetchTeam()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [team.id])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <New team_id={team.id} />
      </header>
      <main className="rounded-lg border shadow-sm">
        <DataTable columns={columns} data={members} />
      </main>
    </div>
  )
}
