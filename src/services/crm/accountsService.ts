
import { supabase } from '@/integrations/supabase/client';
import type { Account } from '@/types/supabase-schema';

export class AccountsService {
  static async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const accountsService = AccountsService;
