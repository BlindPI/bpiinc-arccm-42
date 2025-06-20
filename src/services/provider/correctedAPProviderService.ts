import { supabase } from '@/integrations/supabase/client'

/**
 * Corrected AP Provider Service
 * Core Principle: AP User IS the Provider (no separate provider entity needed)
 * 
 * This service replaces the complex provider sync system with direct relationships:
 * - AP users are directly assigned to locations
 * - Teams are directly assigned to AP users
 * - No sync triggers or intermediate provider entities
 */
export class CorrectedAPProviderService {
  
  /**
   * Assign AP User to Location (Single Source of Truth)
   * AP User IS the provider - no conversion needed
   */
  async assignAPUserToLocation(apUserId: string, locationId: string, assignedBy?: string, notes?: string) {
    try {
      // Validate AP user exists and is active
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name, role, status')
        .eq('id', apUserId)
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .single()
      
      if (userError || !apUser) {
        return { 
          success: false, 
          error: 'User is not an active AP user',
          details: userError 
        }
      }
      
      // Validate location exists
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('id', locationId)
        .single()
      
      if (locationError || !location) {
        return { 
          success: false, 
          error: 'Location does not exist',
          details: locationError 
        }
      }
      
      // Direct assignment - no sync needed
      const { data, error } = await supabase
        .from('ap_user_location_assignments')
        .insert({
          ap_user_id: apUserId,
          location_id: locationId,
          status: 'active',
          assigned_by: assignedBy || (await supabase.auth.getUser()).data.user?.id,
          assigned_at: new Date().toISOString(),
          notes: notes
        })
        .select()
        .single()
      
      if (error) {
        // Handle unique constraint violation (already assigned)
        if (error.code === '23505') {
          // Update existing assignment to active
          const { data: updated, error: updateError } = await supabase
            .from('ap_user_location_assignments')
            .update({
              status: 'active',
              assigned_by: assignedBy || (await supabase.auth.getUser()).data.user?.id,
              updated_at: new Date().toISOString(),
              notes: notes
            })
            .eq('ap_user_id', apUserId)
            .eq('location_id', locationId)
            .select()
            .single()
          
          return { 
            success: !updateError, 
            data: updated,
            message: `${apUser.display_name} assignment to ${location.name} updated to active`
          }
        }
        
        return { success: false, error: error.message, details: error }
      }
      
      return { 
        success: true, 
        data,
        message: `${apUser.display_name} successfully assigned to ${location.name}`
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to assign AP user to location',
        details: err 
      }
    }
  }

  /**
   * Create team directly assigned to AP user
   * No provider middleman needed
   */
  async createTeamForAPUser(teamData: {
    name: string
    locationId: string
    assignedAPUserId: string
    teamType?: string
    description?: string
  }) {
    try {
      // Validate AP user is assigned to this location
      const { data: assignment, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .select('id, ap_user_id, location_id')
        .eq('ap_user_id', teamData.assignedAPUserId)
        .eq('location_id', teamData.locationId)
        .eq('status', 'active')
        .single()
      
      if (assignmentError || !assignment) {
        return {
          success: false,
          error: 'AP user is not assigned to this location'
        }
      }
      
      // Create team directly assigned to AP user
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.locationId,
          assigned_ap_user_id: teamData.assignedAPUserId,
          created_by_ap_user_id: (await supabase.auth.getUser()).data.user?.id || teamData.assignedAPUserId,
          team_type: teamData.teamType || 'general',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select(`
          id, name, description, team_type, created_at,
          locations!inner(name),
          profiles!teams_assigned_ap_user_id_fkey(display_name)
        `)
        .single()
      
      if (error) {
        return { success: false, error: error.message, details: error }
      }
      
      return { 
        success: true, 
        teamId: data.id,
        data,
        message: `Team "${teamData.name}" created successfully`
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to create team',
        details: err 
      }
    }
  }

  /**
   * Get AP user dashboard - their locations and teams
   * Single query path - no complex joins or sync status
   */
  async getAPUserDashboard(apUserId: string) {
    try {
      // Get user's location assignments with location details
      const { data: assignments, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          location_id,
          assigned_at,
          notes,
          locations!inner(id, name, city, state)
        `)
        .eq('ap_user_id', apUserId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false })

      if (assignmentError) {
        return { success: false, error: assignmentError.message }
      }

      // Build dashboard for each location
      const locationDashboard = []
      for (const assignment of assignments || []) {
        // Get teams assigned to this AP user at this location
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id, name, team_type, description, created_at,
            team_members!inner(id, status)
          `)
          .eq('location_id', assignment.location_id)
          .eq('assigned_ap_user_id', apUserId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        const activeMembers = teams?.reduce((sum, team) => 
          sum + (team.team_members?.filter(m => m.status === 'active').length || 0), 0
        ) || 0

        locationDashboard.push({
          locationId: assignment.location_id,
          locationName: assignment.locations.name,
          locationCity: assignment.locations.city,
          locationState: assignment.locations.state,
          assignedAt: assignment.assigned_at,
          notes: assignment.notes,
          teams: teams || [],
          teamCount: teams?.length || 0,
          memberCount: activeMembers
        })
      }

      return { 
        success: true, 
        data: locationDashboard,
        summary: {
          totalLocations: locationDashboard.length,
          totalTeams: locationDashboard.reduce((sum, loc) => sum + loc.teamCount, 0),
          totalMembers: locationDashboard.reduce((sum, loc) => sum + loc.memberCount, 0)
        }
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to get AP user dashboard',
        details: err 
      }
    }
  }

  /**
   * Get system overview for admin
   * Shows all AP users and their assignment status
   */
  async getSystemOverview() {
    try {
      // All AP users
      const { data: apUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization, created_at')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name')

      if (usersError) {
        return { success: false, error: usersError.message }
      }

      // Get assignment counts for each AP user
      const usersWithAssignments = []
      for (const user of apUsers || []) {
        const { data: assignments, error: assignmentError } = await supabase
          .from('ap_user_location_assignments')
          .select(`
            location_id,
            locations!inner(name)
          `)
          .eq('ap_user_id', user.id)
          .eq('status', 'active')

        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id')
          .eq('assigned_ap_user_id', user.id)
          .eq('status', 'active')

        usersWithAssignments.push({
          ...user,
          assignedLocations: assignments?.length || 0,
          locationNames: assignments?.map(a => a.locations.name) || [],
          managedTeams: teams?.length || 0,
          assignmentStatus: (assignments?.length || 0) > 0 ? 'assigned' : 'unassigned'
        })
      }

      const assignedCount = usersWithAssignments.filter(u => u.assignmentStatus === 'assigned').length
      const unassignedCount = usersWithAssignments.filter(u => u.assignmentStatus === 'unassigned').length

      return {
        success: true,
        data: {
          apUsers: usersWithAssignments,
          summary: {
            totalAPUsers: apUsers?.length || 0,
            assignedAPUsers: assignedCount,
            unassignedAPUsers: unassignedCount,
            totalManagedTeams: usersWithAssignments.reduce((sum, user) => sum + user.managedTeams, 0)
          },
          issues: [] // No sync issues with direct relationships!
        }
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to get system overview',
        details: err 
      }
    }
  }

  /**
   * Remove AP user from location
   * This will also affect teams assigned to them at that location
   */
  async removeAPUserFromLocation(apUserId: string, locationId: string) {
    try {
      // Check if AP user has teams at this location
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('assigned_ap_user_id', apUserId)
        .eq('location_id', locationId)
        .eq('status', 'active')

      // Deactivate the assignment
      const { error: updateError } = await supabase
        .from('ap_user_location_assignments')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('ap_user_id', apUserId)
        .eq('location_id', locationId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return {
        success: true,
        message: 'AP user removed from location',
        affectedTeams: teams?.length || 0,
        teamNames: teams?.map(t => t.name) || []
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to remove AP user from location',
        details: err 
      }
    }
  }

  /**
   * Get available AP users for assignment
   * These are AP users who are active but not yet assigned to the specified location
   */
  async getAvailableAPUsers(locationId: string) {
    try {
      // Get all active AP users
      const { data: allAPUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name')

      if (usersError) {
        return { success: false, error: usersError.message }
      }

      // Get AP users already assigned to this location
      const { data: assignedUsers, error: assignedError } = await supabase
        .from('ap_user_location_assignments')
        .select('ap_user_id')
        .eq('location_id', locationId)
        .eq('status', 'active')

      if (assignedError) {
        return { success: false, error: assignedError.message }
      }

      const assignedUserIds = new Set(assignedUsers?.map(a => a.ap_user_id) || [])
      const availableUsers = allAPUsers?.filter(user => !assignedUserIds.has(user.id)) || []

      return {
        success: true,
        data: availableUsers,
        count: availableUsers.length
      }
      
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to get available AP users',
        details: err 
      }
    }
  }
}

// Singleton instance
export const correctedAPProviderService = new CorrectedAPProviderService()