
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AuthUserWithProfile } from '@/types/auth';

export function useAuthInit() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  // This effect handles session changes
  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    // Get initial session and set up auth listener
    (async () => {
      try {
        // Begin by marking loading
        setLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Handle any fetch errors
        if (error) {
          console.error('Error fetching auth session:', error);
          // We tolerate errors here as not to block the app
          if (mounted) {
            setSessionChecked(true);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          // Update user based on session
          handleSessionChange(session);
          setSessionChecked(true);
          setAuthReady(true);
        }
        
        // Set up auth state change listener
        authListener = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('Auth state changed. Event:', _event);
          
          if (mounted) {
            handleSessionChange(session);
            
            // Handle different auth events
            if (_event === 'SIGNED_IN') {
              // On sign in, invalidate any cached profile data
              queryClient.invalidateQueries({ queryKey: ['profile'] });
              queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
            } else if (_event === 'SIGNED_OUT') {
              // On sign out, clear cached data
              queryClient.clear();
              setUser(null);
              setSession(null);
            }
          }
        });
      } catch (err) {
        console.error('Unexpected error in auth initialization:', err);
        
        if (mounted) {
          // If there's an error, set the session as checked and complete loading
          setUser(null);
          setSessionChecked(true);
          setLoading(false);
          toast.error("Error during authentication initialization. Please refresh the page.");
        }
      }
    })();

    // Function to handle session changes
    function handleSessionChange(session: Session | null) {
      const currentUser = session?.user || null;
      if (currentUser) {
        // We'll set a minimal user object here, and let useProfile fetch the full profile
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          role: 'IT', // Default role until profile is loaded
          created_at: currentUser.created_at,
          last_sign_in_at: currentUser.last_sign_in_at
        });
      } else {
        setUser(null);
      }
      setSession(session);
      setLoading(false);
    }

    return () => {
      mounted = false;
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [queryClient]);

  return { 
    user, 
    session, 
    loading, 
    authReady,
    setUser, 
    setSession,
    setLoading, 
    sessionChecked 
  };
}
