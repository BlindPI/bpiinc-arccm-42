
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

export interface UIRequirement {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'form' | 'link' | 'video';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  dueDate?: string;
  isRequired: boolean;
  completionPercentage: number;
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

export const useUIRequirements = (userId: string) => {
  return useQuery({
    queryKey: ['ui-requirements', userId],
    queryFn: async (): Promise<UIRequirement[]> => {
      try {
        // Get user compliance records
        const { data: complianceRecords, error: complianceError } = await supabase
          .from('user_compliance_records')
          .select(`
            *,
            compliance_requirements (
              id,
              name,
              description,
              requirement_type,
              due_date
            )
          `)
          .eq('user_id', userId);

        if (complianceError) throw complianceError;

        // Transform to UI format
        const uiRequirements: UIRequirement[] = (complianceRecords || []).map(record => ({
          id: record.id,
          title: record.compliance_requirements?.name || 'Compliance Requirement',
          description: record.compliance_requirements?.description || '',
          type: record.compliance_requirements?.requirement_type || 'document',
          status: record.compliance_status as 'pending' | 'submitted' | 'approved' | 'rejected',
          dueDate: record.compliance_requirements?.due_date,
          isRequired: true,
          completionPercentage: record.compliance_status === 'approved' ? 100 : 
                                record.compliance_status === 'submitted' ? 75 : 0
        }));

        return uiRequirements;
      } catch (error) {
        console.error('Error fetching UI requirements:', error);
        return [];
      }
    },
    enabled: !!userId
  });
};
