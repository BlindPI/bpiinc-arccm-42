
import { supabase } from '@/integrations/supabase/client';
import type { Account } from '@/types/supabase-schema';

export class AccountsService {
  static transformAccount(dbAccount: any): Account {
    return {
      ...dbAccount,
      account_type: dbAccount.account_type as 'prospect' | 'customer' | 'partner' | 'competitor',
      account_status: dbAccount.account_status as 'active' | 'inactive' | 'suspended'
    };
  }

  static async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformAccount);
  }
}

export const accountsService = AccountsService;
