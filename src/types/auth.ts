
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = SupabaseUser;

export interface ImpersonationState {
  isImpersonating: boolean;
  originalRole: string | null;
  impersonatedRole: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  impersonationState: ImpersonationState;
  startImpersonation: (role: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

