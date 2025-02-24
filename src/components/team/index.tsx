
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"
import { useToast } from "../ui/use-toast"
import type { TeamMember, Team, Profile } from "@/types/user-management"
import { CreateTeam } from "./create"
import { TeamSelector } from "./select"
import { TeamSettings } from "./settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Team() {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchTeam = async (teamId: string) => {
    try {
      setLoading(true)
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single()

      if (teamError) throw teamError

      // First fetch team members
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)

      if (memberError) throw memberError

      // Then fetch profiles for these members
      const memberProfiles = await Promise.all(
        (memberData || []).map(async (member) => {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", member.user_id)
            .single()

          if (profileError) {
            console.error(`Error fetching profile for user ${member.user_id}:`, profileError)
            return null
          }

          return profile
        })
      )

      // Transform the data to match the TeamMember interface
      const transformedMembers = (memberData || []).map((member, index) => {
        const profile = memberProfiles[index]
        return {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as 'MEMBER' | 'ADMIN',
          created_at: member.created_at,
          updated_at: member.updated_at,
          profile: profile as Profile | null,
          display_name: profile?.display_name || 'Unknown'
        }
      }) satisfies TeamMember[]

      setTeam(teamData)
      setMembers(transformedMembers)
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
    if (team?.id) {
      fetchTeam(team.id)

      const subscription = supabase
        .channel('channel_team_members')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${team.id}`
        }, () => {
          fetchTeam(team.id)
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [team?.id])

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their roles.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CreateTeam />
          {team && <New team_id={team.id} />}
        </div>
      </header>

      <div className="rounded-lg border bg-card p-4">
        <TeamSelector
          selectedTeamId={team?.id || ""}
          onTeamSelect={(teamId) => fetchTeam(teamId)}
        />
      </div>

      {team ? (
        <div className="rounded-lg border bg-card">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-4">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <div className="p-4">
              <TabsContent value="members">
                <DataTable columns={columns} data={members} />
              </TabsContent>
              <TabsContent value="settings">
                <TeamSettings team={team} onUpdate={setTeam} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Please select or create a team to get started.
        </div>
      )}
    </div>
  )
}
