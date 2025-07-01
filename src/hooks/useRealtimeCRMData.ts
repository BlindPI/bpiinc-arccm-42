
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeCRMData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to leads table changes
    const leadsSubscription = supabase
      .channel('crm_leads_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        }
      )
      .subscribe();

    // Subscribe to contacts table changes
    const contactsSubscription = supabase
      .channel('crm_contacts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crm_contacts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
        }
      )
      .subscribe();

    // Subscribe to accounts table changes
    const accountsSubscription = supabase
      .channel('crm_accounts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crm_accounts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
        }
      )
      .subscribe();

    // Subscribe to opportunities table changes
    const opportunitiesSubscription = supabase
      .channel('crm_opportunities_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crm_opportunities' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
        }
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      contactsSubscription.unsubscribe();
      accountsSubscription.unsubscribe();
      opportunitiesSubscription.unsubscribe();
    };
  }, [queryClient]);
}
