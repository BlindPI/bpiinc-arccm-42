import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { supabase } from '@/integrations/supabase/client';

interface DebugData {
  userId?: string;
  userRole?: string;
  teamMemberships?: any[];
  apLocationAssignments?: any[];
  teamData?: any;
  locationData?: any;
  certificates?: any[];
  recentActivities?: any[];
  errors?: string[];
}

export const DashboardDataDebugger: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: teamMemberships = [] } = useTeamMemberships();
  const [debugData, setDebugData] = useState<DebugData>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchDebugData = async () => {
      if (!user?.id || !profile?.role) {
        setLoading(false);
        return;
      }

      const data: DebugData = {
        userId: user.id,
        userRole: profile.role,
        teamMemberships,
        errors: []
      };

      try {
        // Get AP user location assignments if applicable
        if (profile.role === 'AP') {
          const { data: assignments, error } = await supabase
            .from('ap_user_location_assignments')
            .select(`
              id,
              ap_user_id,
              location_id,
              status,
              locations (
                id,
                name,
                city,
                state,
                address
              )
            `)
            .eq('ap_user_id', user.id);

          if (error) {
            data.errors?.push(`AP location assignments error: ${error.message}`);
          } else {
            data.apLocationAssignments = assignments;
          }
        }

        // Get team data if user is in a team
        if (teamMemberships.length > 0) {
          const primaryTeam = teamMemberships[0];
          const { data: team, error } = await supabase
            .from('teams')
            .select(`
              id,
              name,
              location_id,
              provider_id,
              locations (
                id,
                name,
                city,
                state,
                address
              )
            `)
            .eq('id', primaryTeam.team_id)
            .single();

          if (error) {
            data.errors?.push(`Team data error: ${error.message}`);
          } else {
            data.teamData = team;
            
            // Get location data
            if (team.location_id) {
              const { data: certificates, error: certsError } = await supabase
                .from('certificates')
                .select('id, course_name, created_at, recipient_name, location_id')
                .eq('location_id', team.location_id)
                .limit(5);
                
              if (certsError) {
                data.errors?.push(`Certificates error: ${certsError.message}`);
              } else {
                data.certificates = certificates;
              }
            }
          }
        }

        // Get recent activities
        const activities = await DashboardDataService.getRecentActivities(
          user.id,
          profile.role,
          teamMemberships.length > 0 ? teamMemberships[0].team_id : undefined
        );
        
        data.recentActivities = activities;

      } catch (error: any) {
        data.errors?.push(`General error: ${error.message}`);
      }

      setDebugData(data);
      setLoading(false);
    };

    fetchDebugData();
  }, [user, profile, teamMemberships]);

  if (loading) {
    return <div className="p-4">Loading debug data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto my-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Data Debugger</h1>
      
      <div className="mb-4 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'summary' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'relationships' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('relationships')}
        >
          Relationships
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'activities' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          Activities
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'errors' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Errors
        </button>
      </div>
      
      {activeTab === 'summary' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">User Context</h2>
          <div className="bg-gray-50 p-3 rounded mb-4">
            <p><strong>User ID:</strong> {debugData.userId}</p>
            <p><strong>Role:</strong> {debugData.userRole}</p>
            <p><strong>Teams:</strong> {debugData.teamMemberships?.length || 0}</p>
            <p><strong>AP Location Assignments:</strong> {debugData.apLocationAssignments?.length || 0}</p>
          </div>
          
          {debugData.errors && debugData.errors.length > 0 && (
            <div className="bg-red-50 p-3 rounded border border-red-200 mb-4">
              <p className="font-semibold text-red-700">Found {debugData.errors.length} errors</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'relationships' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Data Relationships</h2>
          
          {debugData.teamData && (
            <div className="mb-4">
              <h3 className="font-medium">Team Data</h3>
              <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.teamData, null, 2)}
              </pre>
            </div>
          )}
          
          {debugData.apLocationAssignments && debugData.apLocationAssignments.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium">AP Location Assignments</h3>
              <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.apLocationAssignments, null, 2)}
              </pre>
            </div>
          )}
          
          {debugData.certificates && debugData.certificates.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium">Location Certificates</h3>
              <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.certificates, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'activities' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Recent Activities</h2>
          {debugData.recentActivities && debugData.recentActivities.length > 0 ? (
            <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-80">
              {JSON.stringify(debugData.recentActivities, null, 2)}
            </pre>
          ) : (
            <p>No recent activities found</p>
          )}
        </div>
      )}
      
      {activeTab === 'errors' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Errors</h2>
          {debugData.errors && debugData.errors.length > 0 ? (
            <ul className="list-disc pl-5">
              {debugData.errors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          ) : (
            <p>No errors detected</p>
          )}
        </div>
      )}
    </div>
  );
};