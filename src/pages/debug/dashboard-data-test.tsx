import React, { useState, useEffect } from 'react';
import { useRoleBasedDashboardData } from '@/hooks/useRoleBasedDashboardData';
import { DashboardDataDebugger } from '@/components/debug/DashboardDataDebugger';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { debugDashboardRelationships, debugCertificateAssociations, debugAPUserAssignments } from '@/utils/debugDashboardRelationships';

const DashboardDataTestPage: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const dashboardData = useRoleBasedDashboardData();
  const [showRawData, setShowRawData] = useState(false);
  const [relationshipData, setRelationshipData] = useState<any>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [activeDebugTab, setActiveDebugTab] = useState('relationships');
  const [certificateData, setCertificateData] = useState<any>(null);
  const [apUserData, setApUserData] = useState<any>(null);

  if (!user || !profile) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard Data Test</h1>
        <p>Please log in to view dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Data Test</h1>
        <div>
          <span className="mr-2 px-3 py-1 bg-blue-100 rounded-full text-sm">
            User: {profile.display_name || user.email}
          </span>
          <span className="px-3 py-1 bg-green-100 rounded-full text-sm">
            Role: {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dashboard Data</h2>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              {showRawData ? 'Show Formatted' : 'Show Raw Data'}
            </button>
          </div>

          {dashboardData.isLoading ? (
            <p>Loading dashboard data...</p>
          ) : dashboardData.error ? (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-red-700">Error: {dashboardData.error}</p>
            </div>
          ) : showRawData ? (
            <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-[600px] text-xs">
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-medium mb-2">Access Levels</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded ${dashboardData.canViewSystemMetrics ? 'bg-green-100' : 'bg-gray-100'}`}>
                    System Metrics: {dashboardData.canViewSystemMetrics ? 'Yes' : 'No'}
                  </div>
                  <div className={`p-2 rounded ${dashboardData.canViewTeamMetrics ? 'bg-green-100' : 'bg-gray-100'}`}>
                    Team Metrics: {dashboardData.canViewTeamMetrics ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {dashboardData.teamContext && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Team Context</h3>
                  <div className="bg-blue-50 p-3 rounded">
                    <p><strong>Team:</strong> {dashboardData.teamContext.teamName}</p>
                    <p><strong>Location:</strong> {dashboardData.teamContext.locationName}</p>
                    {dashboardData.teamContext.locationCity && (
                      <p><strong>City:</strong> {dashboardData.teamContext.locationCity}</p>
                    )}
                    {dashboardData.teamContext.locationState && (
                      <p><strong>State:</strong> {dashboardData.teamContext.locationState}</p>
                    )}
                    {dashboardData.teamContext.apUserName && (
                      <>
                        <p className="mt-2"><strong>AP Contact:</strong> {dashboardData.teamContext.apUserName}</p>
                        <p><strong>Email:</strong> {dashboardData.teamContext.apUserEmail}</p>
                        <p><strong>Phone:</strong> {dashboardData.teamContext.apUserPhone}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-medium mb-2">Metrics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(dashboardData.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Activities</h3>
                {dashboardData.recentActivities.length > 0 ? (
                  <ul className="divide-y">
                    {dashboardData.recentActivities.map((activity) => (
                      <li key={activity.id} className="py-2">
                        <p className="font-medium">{activity.description}</p>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{activity.type}</span>
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                        {activity.user_name && (
                          <p className="text-sm text-gray-600">{activity.user_name}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent activities</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <DashboardDataDebugger />
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Advanced Debugging</h2>
        
        <div className="mb-4 border-b">
          <button
            className={`px-4 py-2 ${activeDebugTab === 'relationships' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveDebugTab('relationships')}
          >
            User Relationships
          </button>
          <button
            className={`px-4 py-2 ${activeDebugTab === 'certificates' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveDebugTab('certificates')}
          >
            Certificate Associations
          </button>
          <button
            className={`px-4 py-2 ${activeDebugTab === 'apusers' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveDebugTab('apusers')}
          >
            AP User Assignments
          </button>
        </div>

        {activeDebugTab === 'relationships' && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  setRelationshipLoading(true);
                  const data = await debugDashboardRelationships(user.id);
                  setRelationshipData(data);
                  setRelationshipLoading(false);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded mr-4"
                disabled={relationshipLoading}
              >
                {relationshipLoading ? 'Loading...' : 'Debug User Relationships'}
              </button>
              {relationshipData && (
                <span className="text-sm text-gray-500">
                  Found {relationshipData.errors?.length || 0} errors,
                  {relationshipData.inconsistencies?.length || 0} inconsistencies
                </span>
              )}
            </div>

            {relationshipData && (
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-[600px]">
                <h3 className="font-medium mb-2">User: {relationshipData.user?.display_name || 'Unknown'} ({relationshipData.userRole})</h3>
                
                {relationshipData.inconsistencies?.length > 0 && (
                  <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-1">Inconsistencies</h4>
                    <ul className="list-disc pl-5">
                      {relationshipData.inconsistencies.map((issue: string, i: number) => (
                        <li key={i} className="text-yellow-700">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {relationshipData.errors?.length > 0 && (
                  <div className="mb-4 bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="font-medium text-red-800 mb-1">Errors</h4>
                    <ul className="list-disc pl-5">
                      {relationshipData.errors.map((error: string, i: number) => (
                        <li key={i} className="text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">AP Location Assignments ({relationshipData.apLocationAssignments?.length || 0})</h4>
                    {relationshipData.apLocationAssignments?.length > 0 ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(relationshipData.apLocationAssignments, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No AP location assignments</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Team Memberships ({relationshipData.teamMemberships?.length || 0})</h4>
                    {relationshipData.teamMemberships?.length > 0 ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(relationshipData.teamMemberships, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No team memberships</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Teams ({relationshipData.teams?.length || 0})</h4>
                    {relationshipData.teams?.length > 0 ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(relationshipData.teams, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No teams</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Locations ({relationshipData.locations?.length || 0})</h4>
                    {relationshipData.locations?.length > 0 ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(relationshipData.locations, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No locations</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-1">Certificates ({relationshipData.certificates?.length || 0})</h4>
                    {relationshipData.certificates?.length > 0 ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(relationshipData.certificates, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500">No certificates</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeDebugTab === 'certificates' && (
          <div>
            <div className="flex items-center mb-4">
              <input
                type="text"
                placeholder="Enter location ID"
                className="border rounded px-3 py-2 mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const locationId = (e.target as HTMLInputElement).value;
                    if (locationId) {
                      debugCertificateAssociations(locationId).then(setCertificateData);
                    }
                  }
                }}
              />
              <button
                onClick={async () => {
                  const locationId = (document.querySelector('input[placeholder="Enter location ID"]') as HTMLInputElement).value;
                  if (locationId) {
                    const data = await debugCertificateAssociations(locationId);
                    setCertificateData(data);
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Debug Certificates
              </button>
            </div>

            {certificateData && (
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-[600px]">
                {certificateData.error ? (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-red-700">Error: {certificateData.error}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium mb-2">
                      Location: {certificateData.location?.name}
                      ({certificateData.certificateCount} certificates)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Location Details</h4>
                        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(certificateData.location, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Teams ({certificateData.teams?.length || 0})</h4>
                        {certificateData.teams?.length > 0 ? (
                          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(certificateData.teams, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-gray-500">No teams for this location</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="font-medium mb-1">Certificates</h4>
                        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-80">
                          {JSON.stringify(certificateData.certificates, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeDebugTab === 'apusers' && (
          <div>
            <div className="flex items-center mb-4">
              <input
                type="text"
                placeholder="Enter AP user ID"
                className="border rounded px-3 py-2 mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const userId = (e.target as HTMLInputElement).value;
                    if (userId) {
                      debugAPUserAssignments(userId).then(setApUserData);
                    }
                  }
                }}
              />
              <button
                onClick={async () => {
                  const userId = (document.querySelector('input[placeholder="Enter AP user ID"]') as HTMLInputElement).value;
                  if (userId) {
                    const data = await debugAPUserAssignments(userId);
                    setApUserData(data);
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Debug AP User
              </button>
            </div>

            {apUserData && (
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-[600px]">
                {apUserData.error ? (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-red-700">Error: {apUserData.error}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium mb-2">
                      AP User: {apUserData.profile?.display_name || apUserData.profile?.email}
                      ({apUserData.assignmentCount} location assignments)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">User Profile</h4>
                        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(apUserData.profile, null, 2)}
                        </pre>
                      </div>
                      
                      {apUserData.isProvider && (
                        <div>
                          <h4 className="font-medium mb-1">Provider Record</h4>
                          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(apUserData.provider, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <h4 className="font-medium mb-1">Location Assignments</h4>
                        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-80">
                          {JSON.stringify(apUserData.assignments, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardDataTestPage;