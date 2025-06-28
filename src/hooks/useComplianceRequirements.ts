
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date?: string;
}

export interface RequirementSubmission {
  id: string;
  requirement_id: string;
  user_id: string;
  submission_data: any;
  status: 'submitted' | 'approved' | 'rejected';
  submitted_at: string;
}

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
    }
  });
};

export const useRequirementSubmission = (userId: string, requirementId: string) => {
  const queryClient = useQueryClient();

  const { mutate: submitRequirement } = useMutation({
    mutationFn: async (submissionData: any) => {
      const { data, error } = await supabase
        .from('user_compliance_records')
        .insert({
          user_id: userId,
          requirement_id: requirementId,
          submission_data: submissionData,
          compliance_status: 'submitted'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-requirements', userId] });
    }
  });

  return { submitRequirement };
};

export const useComplianceRequirements = (userId: string) => {
  return useQuery({
    queryKey: ['compliance-requirements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    }
  });
};
