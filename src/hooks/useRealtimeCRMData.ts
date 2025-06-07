
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeCRMData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for changes to leads
    const leadsChannel = supabase
      .channel('crm-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_leads'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
          queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
          queryClient.invalidateQueries({ queryKey: ['revenue-metrics'] });
        }
      )
      .subscribe();

    // Listen for changes to opportunities
    const opportunitiesChannel = supabase
      .channel('crm-opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_opportunities'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
          queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['revenue-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['revenue-forecast'] });
        }
      )
      .subscribe();

    // Listen for changes to contacts
    const contactsChannel = supabase
      .channel('crm-contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_contacts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
          queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
        }
      )
      .subscribe();

    // Listen for changes to email campaigns
    const campaignsChannel = supabase
      .channel('crm-campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_email_campaigns'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
          queryClient.invalidateQueries({ queryKey: ['campaign-analytics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(opportunitiesChannel);
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(campaignsChannel);
    };
  }, [queryClient]);
}
