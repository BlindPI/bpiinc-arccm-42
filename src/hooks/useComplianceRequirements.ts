
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRequirementSubmission = () => {
  const queryClient = useQueryClient();

  const submitRequirement = async ({ userId, requirementId, submissionData }: {
    userId: string;
    requirementId: string;
    submissionData: any;
  }) => {
    const { data, error } = await supabase
      .from('user_compliance_records')
      .upsert({
        user_id: userId,
        requirement_id: requirementId,
        submission_data: submissionData,
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    submitRequirement,
    isLoading: false
  };
};

export const useRequirement = (requirementId: string) => {
  return useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requirementId
  });
};

export const useRequirementDetail = useRequirement;
export const useRequirementHistory = (requirementId: string) => {
  return useQuery({
    queryKey: ['requirement-history', requirementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_activity_log')
        .select('*')
        .eq('requirement_id', requirementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!requirementId
  });
};
