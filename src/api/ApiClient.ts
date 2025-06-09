
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/supabase-schema';

export class ApiClient {
  static async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUserRole(userId: string, role: UserRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
