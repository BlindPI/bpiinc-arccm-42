
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getLocationPrimaryTemplate } from '@/services/certificates/locationTemplateService';

export function useTemplateVerification(locationId?: string) {
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);
  
  // Query to fetch the template based on location, or default if no location specified
  const { data: templateUrl, isLoading } = useQuery({
    queryKey: ['template-url', locationId],
    queryFn: async () => {
      console.log('Fetching template for location:', locationId);
      
      // If locationId is specified, try to get location-specific template first
      if (locationId && locationId !== 'none') {
        console.log('Looking for location-specific template');
        const locationTemplateUrl = await getLocationPrimaryTemplate(locationId);
        if (locationTemplateUrl) {
          console.log('Using location-specific template:', locationTemplateUrl);
          return locationTemplateUrl;
        }
        console.log('No location-specific template found, falling back to default');
      }
      
      // Fallback to default template
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_default', true)
        .single();
      
      if (error) {
        // If no default template found, try to get the most recent one
        if (error.code === 'PGRST116') {
          const { data: recentTemplate, error: recentError } = await supabase
            .from('certificate_templates')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (recentError) throw recentError;
          console.log('Using most recent template:', recentTemplate.url);
          return recentTemplate.url;
        }
        throw error;
      }
      
      console.log('Using default template:', data.url);
      return data.url;
    },
  });

  useEffect(() => {
    if (!isLoading && templateUrl) {
      verifyTemplateAvailability(templateUrl);
    }
  }, [isLoading, templateUrl]);

  const verifyTemplateAvailability = async (templateUrl: string) => {
    if (!templateUrl) {
      setIsTemplateAvailable(false);
      toast.error('No certificate template configured. Please upload one in the Templates tab.');
      return;
    }
    
    try {
      const response = await fetch(templateUrl, { method: 'HEAD' });
      setIsTemplateAvailable(response.ok);
      
      if (!response.ok) {
        toast.error('Certificate template is not accessible. Please check the template in the Templates tab.');
      }
    } catch (error) {
      console.error('Error verifying template:', error);
      setIsTemplateAvailable(false);
      toast.error('Unable to verify template availability');
    }
  };

  return { 
    isTemplateAvailable,
    defaultTemplateUrl: templateUrl || null,
    isLoading 
  };
}
