
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useTemplateVerification() {
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);
  
  // Query to fetch the default template
  const { data: defaultTemplate, isLoading } = useQuery({
    queryKey: ['default-template'],
    queryFn: async () => {
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
          return recentTemplate;
        }
        throw error;
      }
      
      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && defaultTemplate) {
      verifyTemplateAvailability(defaultTemplate.url);
    }
  }, [isLoading, defaultTemplate]);

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
    defaultTemplateUrl: defaultTemplate?.url || null,
    isLoading 
  };
}
