import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UIRequirement {
  id: string;
  name: string;
  description: string;
  type: 'form' | 'file_upload' | 'external_link';
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  form_fields?: any[];
  file_requirements?: any;
  external_url?: string;
  points?: number;
  category?: string;
}

export const useUIRequirements = (userId?: string, role?: string) => {
  return useQuery({
    queryKey: ['ui-requirements', userId, role],
    queryFn: async (): Promise<UIRequirement[]> => {
      if (!userId || !role) return [];

      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .or(`applicable_roles.cs.{${role}},applicable_roles.is.null`)
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) {
        console.error('Error fetching UI requirements:', error);
        throw error;
      }

      // Transform database records to UI format
      return data?.map(req => ({
        id: req.id,
        name: req.name,
        description: req.description || '',
        type: req.requirement_type as 'form' | 'file_upload' | 'external_link',
        priority: req.priority || 'medium',
        due_date: req.due_date,
        status: 'not_started' as const,
        form_fields: req.form_config?.fields || [],
        file_requirements: req.file_config,
        external_url: req.external_url,
        points: req.points || 0,
        category: req.category
      })) || [];
    },
    enabled: !!userId && !!role,
  });
};

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
