
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

export interface ComplianceProgress {
  overallCompletion: number;
  totalRequirements: number;
  completedRequirements: number;
  pendingRequirements: number;
  submittedRequirements: number;
  rejectedRequirements: number;
  progressByType: {
    [key: string]: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
}

export interface ComplianceActivity {
  id: string;
  action: string;
  requirementName: string;
  timestamp: string;
  status: string;
  description: string;
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

export const useComplianceProgress = (userId: string) => {
  return useQuery({
    queryKey: ['compliance-progress', userId],
    queryFn: async (): Promise<ComplianceProgress> => {
      try {
        const { data: records, error } = await supabase
          .from('user_compliance_records')
          .select(`
            *,
            compliance_requirements (
              id,
              name,
              requirement_type
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        const total = records?.length || 0;
        const completed = records?.filter(r => r.compliance_status === 'approved').length || 0;
        const pending = records?.filter(r => r.compliance_status === 'pending').length || 0;
        const submitted = records?.filter(r => r.compliance_status === 'submitted').length || 0;
        const rejected = records?.filter(r => r.compliance_status === 'rejected').length || 0;

        // Calculate progress by type
        const progressByType: { [key: string]: { completed: number; total: number; percentage: number } } = {};
        records?.forEach(record => {
          const type = record.compliance_requirements?.requirement_type || 'unknown';
          if (!progressByType[type]) {
            progressByType[type] = { completed: 0, total: 0, percentage: 0 };
          }
          progressByType[type].total++;
          if (record.compliance_status === 'approved') {
            progressByType[type].completed++;
          }
        });

        // Calculate percentages
        Object.keys(progressByType).forEach(type => {
          const typeData = progressByType[type];
          typeData.percentage = typeData.total > 0 ? Math.round((typeData.completed / typeData.total) * 100) : 0;
        });

        return {
          overallCompletion: total > 0 ? Math.round((completed / total) * 100) : 100,
          totalRequirements: total,
          completedRequirements: completed,
          pendingRequirements: pending,
          submittedRequirements: submitted,
          rejectedRequirements: rejected,
          progressByType
        };
      } catch (error) {
        console.error('Error fetching compliance progress:', error);
        return {
          overallCompletion: 100,
          totalRequirements: 0,
          completedRequirements: 0,
          pendingRequirements: 0,
          submittedRequirements: 0,
          rejectedRequirements: 0,
          progressByType: {}
        };
      }
    },
    enabled: !!userId
  });
};

export const useComplianceActivity = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['compliance-activity', userId, limit],
    queryFn: async (): Promise<ComplianceActivity[]> => {
      try {
        const { data: records, error } = await supabase
          .from('user_compliance_records')
          .select(`
            *,
            compliance_requirements (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return (records || []).map(record => ({
          id: record.id,
          action: record.compliance_status === 'approved' ? 'Approved' : 
                 record.compliance_status === 'submitted' ? 'Submitted' :
                 record.compliance_status === 'rejected' ? 'Rejected' : 'Updated',
          requirementName: record.compliance_requirements?.name || 'Unknown Requirement',
          timestamp: record.updated_at || record.created_at,
          status: record.compliance_status,
          description: `${record.compliance_status === 'approved' ? 'Approved' : 
                       record.compliance_status === 'submitted' ? 'Submitted' :
                       record.compliance_status === 'rejected' ? 'Rejected' : 'Updated'} ${record.compliance_requirements?.name || 'requirement'}`
        }));
      } catch (error) {
        console.error('Error fetching compliance activity:', error);
        return [];
      }
    },
    enabled: !!userId
  });
};
