
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  handleTestUserSignIn, 
  checkTestUserSignOut,
  handleSupabaseSignIn,
  handleSupabaseSignUp,
  handleSupabaseSignOut
} from '@/utils/authUtils';
import { prefetchSystemSettings } from '@/hooks/useSystemSettings';

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const expiresAt = new Date((session.expires_at ?? 0) * 1000);
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      
      if (timeUntilExpiry < 300000) {
        supabase.auth.refreshSession().then(({ data: { session: newSession } }) => {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        });
      }
    };

    const intervalId = setInterval(checkSessionExpiry, 60000);
    
    return () => clearInterval(intervalId);
  }, [session]);

  const signUp = async (email: string, password: string) => {
    try {
      await handleSupabaseSignUp(email, password);
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const settings = await prefetchSystemSettings();
      
      const { mockUser, isTestUser } = await handleTestUserSignIn(email, password, settings);
      if (isTestUser && mockUser) {
        setUser(mockUser);
        toast.success('Signed in as test user');
        navigate('/');
        return;
      }

      const { session } = await handleSupabaseSignIn(email, password);
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    try {
      const settings = await prefetchSystemSettings();
      
      const isTestUser = await checkTestUserSignOut(user?.email, settings);
      if (isTestUser) {
        setUser(null);
        setSession(null);
        toast.success('Test user signed out');
        navigate('/auth');
        return;
      }

      await handleSupabaseSignOut();
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };
};
