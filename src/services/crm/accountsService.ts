
import { supabase } from '@/integrations/supabase/client';
import { Account } from '@/types/crm';

export class AccountsService {
  static async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async createAccount(account: Partial<Account>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
    }
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      return null;
    }
  }

  static async deleteAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }
}
