/**
 * DEBUG TEAM MEMBER DATA LOADING
 * 
 * This utility helps diagnose why team members are showing as "Unknown User"
 * instead of their actual names and profile information.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberDebugInfo {
  member: any;
  user: any;
  profile: any;
  rawData: any;
  issues: string[];
}

/**
 * Debug team member data loading for a specific team
 */
export async function debugTeamMemberData(teamId: string): Promise<{
  success: boolean;
  error?: string;
  debugInfo: TeamMemberDebugInfo[];
  recommendations: string[];
}> {
  console.log(`🔍 Debugging team member data for team: ${teamId}`);
  
  const debugInfo: TeamMemberDebugInfo[] = [];
  const recommendations: string[] = [];
  
  try {
    // Test different query approaches to see what works
    
    // 1. Test basic team members query
    console.log('📋 Testing basic team members query...');
    const { data: basicMembers, error: basicError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active');
    
    if (basicError) {
      console.error('❌ Basic query error:', basicError);
      return {
        success: false,
        error: `Basic query failed: ${basicError.message}`,
        debugInfo: [],
        recommendations: ['Check team_members table permissions', 'Verify team_id exists']
      };
    }
    
    console.log(`✅ Found ${basicMembers?.length || 0} basic team members`);
    
    // 2. Test team members with user join
    console.log('👤 Testing team members with user profile join...');
    const { data: membersWithProfiles, error: profileError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('team_id', teamId)
      .eq('status', 'active');
    
    if (profileError) {
      console.error('❌ Profile join error:', profileError);
      recommendations.push('Check profiles table RLS policies');
      recommendations.push('Verify foreign key relationship between team_members.user_id and profiles.id');
    } else {
      console.log(`✅ Found ${membersWithProfiles?.length || 0} members with profile data`);
    }
    
    // 3. Test direct profiles query for the user IDs
    if (basicMembers && basicMembers.length > 0) {
      const userIds = basicMembers.map(m => m.user_id);
      console.log('🔍 Testing direct profiles query for user IDs:', userIds);
      
      const { data: profiles, error: directProfileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (directProfileError) {
        console.error('❌ Direct profiles query error:', directProfileError);
        recommendations.push('Check profiles table RLS policies');
        recommendations.push('User may not have permission to read profiles');
      } else {
        console.log(`✅ Found ${profiles?.length || 0} profiles directly`);
        console.log('📋 Profile data sample:', profiles?.[0]);
      }
    }
    
    // 4. Analyze each member
    const membersToAnalyze = membersWithProfiles || basicMembers || [];
    
    for (const member of membersToAnalyze) {
      const issues: string[] = [];
      const user = (member as any).user || (member as any).profiles;
      
      // Check for common issues
      if (!member.user_id) {
        issues.push('Missing user_id');
      }
      
      if (!user) {
        issues.push('No user/profile data loaded');
      } else {
        if (!user.id) issues.push('User missing id');
        if (!user.email && !user.display_name) issues.push('User has no email or display_name');
        if (user.email === null) issues.push('Email is explicitly null');
        if (user.display_name === null) issues.push('Display name is explicitly null');
        if (user.phone === null) issues.push('Phone is explicitly null');
      }
      
      debugInfo.push({
        member,
        user,
        profile: user,
        rawData: member,
        issues
      });
    }
    
    // Generate recommendations based on findings
    if (debugInfo.every(info => info.issues.includes('No user/profile data loaded'))) {
      recommendations.push('❌ CRITICAL: No profile data is being loaded - check RLS policies');
      recommendations.push('❌ CRITICAL: Verify team_members.user_id references profiles.id correctly');
    }
    
    if (debugInfo.some(info => info.issues.includes('User has no email or display_name'))) {
      recommendations.push('⚠️  Some users have both null email and display_name');
      recommendations.push('💡 Consider requiring at least one identification field for users');
    }
    
    // 5. Test current user's permissions
    console.log('🔐 Testing current user permissions...');
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.user?.id)
      .single();
    
    console.log('👤 Current user role:', currentProfile?.role);
    console.log('👤 Current user status:', currentProfile?.status);
    
    return {
      success: true,
      debugInfo,
      recommendations
    };
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error);
    return {
      success: false,
      error: error.message,
      debugInfo: [],
      recommendations: ['Check database connection', 'Verify Supabase client configuration']
    };
  }
}

/**
 * Test improved team member query
 */
export async function testImprovedTeamMemberQuery(teamId: string) {
  console.log('🧪 Testing improved team member query...');
  
  // Try multiple query strategies
  const strategies = [
    {
      name: 'Strategy 1: Direct join with profiles table',
      query: async () => supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          performance_score,
          profiles!team_members_user_id_fkey(
            id,
            email,
            display_name,
            phone,
            organization,
            role,
            status
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
    },
    {
      name: 'Strategy 2: Manual join with separate queries',
      query: async () => {
        // First get team members
        const { data: members, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'active');
        
        if (memberError || !members) throw memberError;
        
        // Then get profiles
        const userIds = members.map(m => m.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (profileError) throw profileError;
        
        // Combine data
        return {
          data: members.map(member => ({
            ...member,
            user: profiles?.find(p => p.id === member.user_id)
          })),
          error: null
        };
      }
    },
    {
      name: 'Strategy 3: Use user alias for join',
      query: async () => supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(
            id,
            email,
            display_name,
            phone,
            organization,
            role,
            status
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
    }
  ];
  
  const results = [];
  
  for (const strategy of strategies) {
    try {
      console.log(`🧪 Testing: ${strategy.name}`);
      const result = await strategy.query();
      
      console.log(`✅ Success: ${result.data?.length || 0} members loaded`);
      console.log('📋 Sample data:', result.data?.[0]);
      
      results.push({
        strategy: strategy.name,
        success: true,
        data: result.data,
        memberCount: result.data?.length || 0
      });
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}`);
      results.push({
        strategy: strategy.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

export default {
  debugTeamMemberData,
  testImprovedTeamMemberQuery
};