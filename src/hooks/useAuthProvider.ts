
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
import { ImpersonationState } from '@/types/auth';

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonationState, setImpersonationState] = useState<ImpersonationState>({
    isImpersonating: false,
    originalRole: null,
    impersonatedRole: null
  });
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
      
      // If impersonating, stop impersonation first
      if (impersonationState.isImpersonating) {
        await stopImpersonation();
      }
      
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

  const startImpersonation = async (role: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Store current session state
      const currentRole = user.app_metadata.role || 'IT';
      
      // Create an audit log entry
      await supabase.from('audit_log').insert([{
        operation: 'IMPERSONATION_START',
        table_name: 'profiles',
        row_data: {
          original_role: currentRole,
          impersonated_role: role,
          impersonating_user: user.id
        }
      }]);

      // Update impersonation state
      setImpersonationState({
        isImpersonating: true,
        originalRole: currentRole,
        impersonatedRole: role
      });

      toast.success(`Now viewing as ${role}`);
    } catch (error: any) {
      toast.error('Failed to start impersonation');
      console.error('Impersonation error:', error);
    }
  };

  const stopImpersonation = async () => {
    try {
      if (!impersonationState.isImpersonating) return;

      // Create an audit log entry
      await supabase.from('audit_log').insert([{
        operation: 'IMPERSONATION_END',
        table_name: 'profiles',
        row_data: {
          original_role: impersonationState.originalRole,
          impersonated_role: impersonationState.impersonatedRole,
          impersonating_user: user?.id
        }
      }]);

      // Reset impersonation state
      setImpersonationState({
        isImpersonating: false,
        originalRole: null,
        impersonatedRole: null
      });

      toast.success('Returned to original role');
    } catch (error: any) {
      toast.error('Failed to stop impersonation');
      console.error('Impersonation error:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    impersonationState,
    startImpersonation,
    stopImpersonation
  };
};

