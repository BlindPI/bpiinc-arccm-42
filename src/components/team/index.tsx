
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"
import { useToast } from "../ui/use-toast"
import type { TeamMemberWithProfile, Team, Profile, SafeJson } from "@/types/user-management"
import { TeamSelector } from "./select"
import { TeamSettings } from "./settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { safeTeamConversion } from "./utils/transformers"
import { Card } from "../ui/card"

// Helper function to safely parse JSON permissions
function parsePermissions(permissions: any): SafeJson {
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
    return permissions;
  }
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default function Team() {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([])
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

      const transformedTeam = safeTeamConversion(teamData)

      // First fetch team members with profile information
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(`
          id,
          team_id,
          user_id,
          role,
          location_assignment,
          assignment_start_date,
          assignment_end_date,
          team_position,
          permissions,
          created_at,
          updated_at,
          profiles(
            id,
            role,
            display_name,
            email,
            created_at,
            updated_at
          )
        `)
        .eq("team_id", teamId)

      if (memberError) throw memberError

      // Add explicit type check to ensure memberData is an array
      if (!Array.isArray(memberData)) {
        throw new Error("Expected array of team members but received a different data structure")
      }

      // Ensure we properly transform the data to match the TeamMemberWithProfile type
      const transformedMembers = memberData.map((member): TeamMemberWithProfile => {
        // Extract profile data safely - handle as any to work around the type error
        const profileData = member.profiles as any;
        
        // Create a properly typed profile object if profile data exists
        const profile = profileData ? {
          id: profileData.id,
          role: profileData.role,
          display_name: profileData.display_name,
          email: profileData.email,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        } as Profile : undefined;

        return {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as "MEMBER" | "ADMIN",
          location_assignment: member.location_assignment,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          team_position: member.team_position,
          permissions: parsePermissions(member.permissions),
          created_at: member.created_at,
          updated_at: member.updated_at,
          display_name: profile?.display_name || member.user_id || 'Unknown',
          profile
        };
      });

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
                <TeamSettings 
                  team={team} 
                  onUpdate={(updatedTeam) => setTeam(updatedTeam)} 
                />
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
