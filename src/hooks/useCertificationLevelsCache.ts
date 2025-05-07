
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificationLevel } from '@/types/certification-levels';

// This hook is used for getting certification levels for components that
// need to access them without showing loading states (e.g. in utility functions)
export function useCertificationLevelsCache() {
  const { data: certificationLevels = [] } = useQuery({
    queryKey: ['certification-levels-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_levels')
        .select('*')
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching certification levels:', error);
        return [];
      }
      
      return data as CertificationLevel[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Group certification levels by their type
  const certificationLevelsByType = certificationLevels.reduce((acc: Record<string, string[]>, level) => {
    if (!level.type) return acc;
    if (!acc[level.type]) acc[level.type] = [];
    acc[level.type].push(level.name);
    return acc;
  }, {});

  const getCertificationLevelNames = (type: string) => {
    return certificationLevelsByType[type] || [];
  };

  const isCertificationLevel = (level: string, type: string) => {
    const levels = certificationLevelsByType[type] || [];
    return levels.some(l => l.toLowerCase() === level?.toLowerCase());
  };

  return {
    certificationLevels,
    certificationLevelsByType,
    getCertificationLevelNames,
    isCertificationLevel,
    // Backwards compatibility
    firstAidLevels: getCertificationLevelNames('FIRST_AID'),
    cprLevels: getCertificationLevelNames('CPR'),
    isFirstAidLevel: (level: string) => isCertificationLevel(level, 'FIRST_AID'),
    isCprLevel: (level: string) => isCertificationLevel(level, 'CPR')
  };
}
