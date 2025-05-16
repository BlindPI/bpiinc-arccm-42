import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthDiagnostic = () => {
  const { user, loading: authLoading, session, signOut } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Check session directly from Supabase
  useEffect(() => {
    const checkSession = async () => {
      addLog("Checking session directly from Supabase");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          addLog(`Session check error: ${error.message}`);
        } else {
          addLog(`Session check result: ${data.session ? 'Active session' : 'No session'}`);
          setSessionDetails(data.session);
        }
      } catch (err) {
        addLog(`Session check exception: ${err}`);
      }
    };
    
    checkSession();
  }, []);

  // Fetch profile directly
  const fetchProfile = async () => {
    if (!user?.id) {
      addLog("Cannot fetch profile - no user ID");
      return;
    }
    
    setProfileLoading(true);
    setProfileError(null);
    addLog(`Fetching profile for user ${user.id}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        addLog(`Profile fetch error: ${error.message}`);
        setProfileError(error.message);
      } else {
        addLog(`Profile fetch result: ${data ? 'Profile found' : 'No profile'}`);
        setProfileData(data);
      }
    } catch (err: any) {
      addLog(`Profile fetch exception: ${err.message}`);
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Clear session
  const clearSession = async () => {
    addLog("Clearing session");
    try {
      await supabase.auth.signOut();
      addLog("Session cleared");
    } catch (err: any) {
      addLog(`Clear session error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Diagnostic</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Loading:</strong> {authLoading ? 'Yes' : 'No'}</div>
              <div><strong>User:</strong> {user ? user.id : 'Not logged in'}</div>
              <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
              <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
              <div><strong>Session:</strong> {session ? 'Active' : 'None'}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct Session Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Session:</strong> {sessionDetails ? 'Active' : 'None'}</div>
              {sessionDetails && (
                <>
                  <div><strong>User ID:</strong> {sessionDetails.user?.id || 'N/A'}</div>
                  <div><strong>Expires:</strong> {sessionDetails.expires_at 
                    ? new Date(sessionDetails.expires_at * 1000).toLocaleString() 
                    : 'N/A'}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Data</CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div>Loading profile...</div>
          ) : profileError ? (
            <div className="text-red-500">Error: {profileError}</div>
          ) : profileData ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          ) : (
            <div>No profile data. Click "Fetch Profile" to load.</div>
          )}
          
          <div className="flex gap-4 mt-4">
            <Button onClick={fetchProfile} disabled={!user || profileLoading}>
              Fetch Profile
            </Button>
            <Button onClick={clearSession} variant="destructive">
              Clear Session
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-60 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDiagnostic;