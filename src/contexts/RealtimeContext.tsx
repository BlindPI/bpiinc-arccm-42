
import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface RealtimeContextValue {
  realtimeEnabled: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  realtimeEnabled: false,
});

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Set up realtime subscriptions when the user is authenticated
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up realtime subscriptions for authenticated user');
    
    // Create channel for certificate changes
    const certificatesChannel = supabase
      .channel('db-certificates-changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'certificates' 
          }, 
          (payload) => {
            console.log('Certificate change detected:', payload);
            // Invalidate certificates queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['certificates'] });
          })
      .subscribe();
      
    // Channel for certificate requests
    const requestsChannel = supabase
      .channel('db-certificate-requests-changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'certificate_requests' 
          }, 
          (payload) => {
            console.log('Certificate request change detected:', payload);
            // Invalidate certificate requests queries
            queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
          })
      .subscribe();
      
    // Channel for notifications
    const notificationsChannel = supabase
      .channel('db-notifications-changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Notification change detected:', payload);
            // Invalidate notifications queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
          })
      .subscribe();
      
    // Clean up subscriptions on unmount
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(certificatesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, queryClient]);
  
  return (
    <RealtimeContext.Provider value={{ realtimeEnabled: true }}>
      {children}
    </RealtimeContext.Provider>
  );
};
