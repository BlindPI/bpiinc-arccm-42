
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"

export default function Team() {
  const [team, setTeam] = useState({
    name: "Team",
    id: 'YOUR_TEAM_ID_TO_TEST'
  })
  const [members, setMembers] = useState<any>([])
  const [loading, setLoading] = useState(false)

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("teams")
        .select("*, team_members(*)")
        .eq("id", team.id)
        .single()

      if (error) throw error
      if (data) {
        const { team_members, ...teamData } = data
        setTeam(teamData)
        setMembers(team_members)
      }
    } catch (error: any) {
      console.error(error)
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
    <div className="grid gap-6 border rounded-lg shadow px-5 py-4 w-full max-w-[800px]">
      <header className="flex items-start justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl">{team.name || 'Team'}</h1>
          <p>Invite new members to your team.</p>
        </div>
        <New team_id={team.id} />
      </header>
      <main>
        <DataTable columns={columns} data={members} />
      </main>
    </div>
  )
}
