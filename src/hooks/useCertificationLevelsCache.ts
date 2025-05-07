
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificationLevel } from '@/types/certification-levels';

// This hook is used for getting certification levels for components that
// need to access them without showing loading states (e.g. in utility functions)
export function useCertificationLevelsCache() {
  const { data: firstAidLevels = [] } = useQuery({
    queryKey: ['certification-levels', 'FIRST_AID'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_levels')
        .select('*')
        .eq('type', 'FIRST_AID')
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching first aid levels:', error);
        return [];
      }
      
      return data as CertificationLevel[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: cprLevels = [] } = useQuery({
    queryKey: ['certification-levels', 'CPR'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_levels')
        .select('*')
        .eq('type', 'CPR')
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching CPR levels:', error);
        return [];
      }
      
      return data as CertificationLevel[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getCertificationLevelNames = (type: 'FIRST_AID' | 'CPR') => {
    const levels = type === 'FIRST_AID' ? firstAidLevels : cprLevels;
    return levels.map(level => level.name);
  };

  return {
    firstAidLevels: getCertificationLevelNames('FIRST_AID'),
    cprLevels: getCertificationLevelNames('CPR'),
    isFirstAidLevel: (level: string) => 
      firstAidLevels.some(l => l.name.toLowerCase() === level.toLowerCase()),
    isCprLevel: (level: string) => 
      cprLevels.some(l => l.name.toLowerCase() === level.toLowerCase()),
  };
}
