
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "../DataTable"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"
import { columns } from "./members/columns"
import New from "./new"
import { useToast } from "../ui/use-toast"
import type { TeamMemberWithProfile, EnhancedTeam } from "@/types/team-management"
import { TeamSelector } from "./select"
import { TeamSettings } from "./settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "../ui/card"
import { useQueryClient } from '@tanstack/react-query'

// Helper function to safely parse JSON permissions
function parsePermissions(permissions: any): Record<string, any> {
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

// Helper function to safely parse metadata
function safeParseMetadata(metadata: any): Record<string, any> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// Helper function to safely parse JSON fields
function safeParseJsonField(field: any): Record<string, any> {
  if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
    return field;
  }
  return {};
}

export default function Team() {
  const [team, setTeam] = useState<EnhancedTeam | null>(null)
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const fetchTeam = async (teamId: string) => {
    try {
      setLoading(true)
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single()

      if (teamError) throw teamError

      // First fetch team members with profile information
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(`
          id,
          team_id,
          user_id,
          role,
          status,
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
        
        return {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as "MEMBER" | "ADMIN",
          status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
          location_assignment: member.location_assignment,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          team_position: member.team_position,
          permissions: parsePermissions(member.permissions),
          created_at: member.created_at,
          updated_at: member.updated_at,
          display_name: profileData?.display_name || member.user_id || 'Unknown',
          profiles: profileData ? {
            id: profileData.id,
            display_name: profileData.display_name,
            email: profileData.email,
            role: profileData.role,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
          } : undefined
        };
      });

      // Get location data if location_id exists
      let locationData = null;
      if (teamData.location_id) {
        const { data: locData, error: locError } = await supabase
          .from("locations")
          .select("*")
          .eq("id", teamData.location_id)
          .single();
        
        if (!locError && locData) {
          locationData = {
            id: locData.id,
            name: locData.name,
            address: locData.address,
            city: locData.city,
            state: locData.state,
            created_at: locData.created_at || new Date().toISOString(),
            updated_at: locData.updated_at || new Date().toISOString()
          };
        }
      }

      // Get AP user data if assigned_ap_user_id exists (corrected architecture)
      let apUserData = null;
      if (teamData.assigned_ap_user_id) {
        const { data: apData, error: apError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", teamData.assigned_ap_user_id)
          .eq("role", "AP")
          .eq("status", "ACTIVE")
          .single();
        
        if (!apError && apData) {
          apUserData = {
            id: apData.id,
            name: apData.display_name,
            provider_type: 'authorized_provider',
            status: 'active',
            primary_location_id: teamData.location_id,
            performance_rating: 0,
            compliance_score: 0,
            created_at: apData.created_at || new Date().toISOString(),
            updated_at: apData.updated_at || new Date().toISOString(),
            description: apData.organization || 'Authorized Provider',
            email: apData.email,
            organization: apData.organization
          };
        }
      }

      // Create enhanced team with required metadata - using corrected architecture
      const enhancedTeam: EnhancedTeam = {
        ...teamData,
        // Corrected architecture: Only AP user assignment
        assigned_ap_user_id: teamData.assigned_ap_user_id,
        created_by_ap_user_id: teamData.created_by_ap_user_id,
        status: teamData.status as 'active' | 'inactive' | 'suspended',
        metadata: safeParseMetadata(teamData.metadata),
        monthly_targets: safeParseJsonField(teamData.monthly_targets),
        current_metrics: safeParseJsonField(teamData.current_metrics),
        location: locationData,
        provider: apUserData, // Use AP user data instead of provider data
        assignedAPUser: apUserData, // Add explicit AP user reference
        members: transformedMembers
      };

      setTeam(enhancedTeam)
      setMembers(transformedMembers)

      // Invalidate user team memberships when team data changes
      queryClient.invalidateQueries({ queryKey: ['team-memberships'] });
      
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
        }, (payload) => {
          console.log('Team member change detected:', payload);
          fetchTeam(team.id);
          // Also invalidate user team memberships for real-time updates
          queryClient.invalidateQueries({ queryKey: ['team-memberships'] });
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [team?.id, queryClient])

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
                  onUpdate={(updatedTeam) => {
                    const enhancedUpdated: EnhancedTeam = {
                      ...updatedTeam,
                      assigned_ap_user_id: updatedTeam.assigned_ap_user_id,
                      status: updatedTeam.status as 'active' | 'inactive' | 'suspended',
                      metadata: safeParseMetadata(updatedTeam.metadata),
                      monthly_targets: safeParseJsonField(updatedTeam.monthly_targets),
                      current_metrics: safeParseJsonField(updatedTeam.current_metrics),
                      members: team.members,
                      location: updatedTeam.location ? {
                        id: updatedTeam.location.id,
                        name: updatedTeam.location.name,
                        address: updatedTeam.location.address,
                        city: updatedTeam.location.city,
                        state: updatedTeam.location.state,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      } : undefined,
                      apUser: updatedTeam.apUser ? {
                        id: updatedTeam.apUser.id,
                        display_name: updatedTeam.apUser.display_name,
                        email: updatedTeam.apUser.email,
                        organization: updatedTeam.apUser.organization,
                        primary_location_id: undefined,
                        performance_rating: 0,
                        compliance_score: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      } : undefined
                    };
                    setTeam(enhancedUpdated);
                  }} 
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
