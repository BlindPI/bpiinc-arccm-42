
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"
import { useToast } from "../ui/use-toast"
import type { TeamMember, Team } from "@/types/user-management"
import { CreateTeam } from "./create"
import { TeamSelector } from "./select"
import { TeamSettings } from "./settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { transformTeamData } from "./utils/transformers"
import { Card } from "../ui/card"

export default function Team() {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
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

      const transformedTeam = transformTeamData(teamData)

      // First fetch team members with profile information
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(`
          *,
          profile:profiles(
            id,
            role,
            display_name,
            created_at
          )
        `)
        .eq("team_id", teamId)

      if (memberError) throw memberError

      const transformedMembers: TeamMember[] = memberData.map((member) => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        created_at: member.created_at,
        updated_at: member.updated_at,
        profile: member.profile,
        display_name: member.profile?.display_name || 'Unknown'
      }))

      setTeam(transformedTeam)
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

      // Subscribe to team member changes
      const subscription = supabase
        .channel('team_members_changes')
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
          {!team && <CreateTeam />}
          {team && <New team_id={team.id} />}
        </div>
      </header>

      <Card className="p-6">
        <TeamSelector
          selectedTeamId={team?.id || ""}
          onTeamSelect={(teamId) => fetchTeam(teamId)}
        />
      </Card>

      {team ? (
        <Card>
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
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          Please select or create a team to get started.
        </Card>
      )}
    </div>
  )
}
