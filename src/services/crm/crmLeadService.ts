import { supabase } from '@/integrations/supabase/client';
import { 
  CRMLead, 
  CreateLeadData, 
  LeadFilters, 
  CRMServiceResponse, 
  PaginatedResponse,
  LeadScoringConfig 
} from '@/types/crm';

export class CRMLeadService {
  private leadScoringConfig: LeadScoringConfig = {
    urgency_weights: {
      immediate: 40,
      within_month: 30,
      within_quarter: 20,
      planning: 10
    },
    company_size_weights: {
      '1-10': 10,
      '11-50': 15,
      '51-200': 20,
      '201-500': 25,
      '500+': 30
    },
    contact_quality_weights: {
      has_phone_and_email: 10,
      has_company_name: 5,
      has_job_title: 5
    },
    volume_weights: {
      participant_count_multiplier: 2,
      max_volume_score: 25
    },
    industry_weights: {
      'construction': 25,
      'healthcare': 25,
      'manufacturing': 20,
      'transportation': 20,
      'education': 15,
      'government': 15,
      'retail': 10,
      'other': 5
    }
  };

  /**
   * Create a new lead
   */
  async createLead(leadData: CreateLeadData): Promise<CRMServiceResponse<CRMLead>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_leads')
        .insert({
          ...leadData,
          created_by: user.id,
          lead_score: this.calculateLeadScore(leadData)
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        return { success: false, error: error.message };
      }

      // Auto-assign lead if not already assigned
      if (!leadData.assigned_to) {
        await this.autoAssignLead(data.id);
      }

      // Trigger lead scoring and automation
      await this.triggerLeadAutomation(data.id);

      return { success: true, data };
    } catch (error) {
      console.error('Error in createLead:', error);
      return { success: false, error: 'Failed to create lead' };
    }
  }

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(
    filters: LeadFilters = {}, 
    page: number = 1, 
    limit: number = 50
  ): Promise<CRMServiceResponse<PaginatedResponse<CRMLead>>> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.lead_type) {
        query = query.eq('lead_type', filters.lead_type);
      }
      if (filters.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }
      if (filters.lead_status) {
        query = query.eq('lead_status', filters.lead_status);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.min_score !== undefined) {
        query = query.gte('lead_score', filters.min_score);
      }
      if (filters.max_score !== undefined) {
        query = query.lte('lead_score', filters.max_score);
      }
      if (filters.training_urgency) {
        query = query.eq('training_urgency', filters.training_urgency);
      }
      if (filters.company_size) {
        query = query.eq('company_size', filters.company_size);
      }
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.province) {
        query = query.eq('province', filters.province);
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }
      if (filters.next_follow_up_after) {
        query = query.gte('next_follow_up_date', filters.next_follow_up_after);
      }
      if (filters.next_follow_up_before) {
        query = query.lte('next_follow_up_date', filters.next_follow_up_before);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('lead_score', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Error in getLeads:', error);
      return { success: false, error: 'Failed to fetch leads' };
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(leadId: string): Promise<CRMServiceResponse<CRMLead>> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('Error fetching lead:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getLead:', error);
      return { success: false, error: 'Failed to fetch lead' };
    }
  }

  /**
   * Update a lead
   */
  async updateLead(leadId: string, updates: Partial<CRMLead>): Promise<CRMServiceResponse<CRMLead>> {
    try {
      // Recalculate lead score if relevant fields changed
      if (this.shouldRecalculateScore(updates)) {
        const leadResponse = await this.getLead(leadId);
        if (leadResponse.success && leadResponse.data) {
          const updatedLeadData = { ...leadResponse.data, ...updates };
          updates.lead_score = this.calculateLeadScore(updatedLeadData);
        }
      }

      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateLead:', error);
      return { success: false, error: 'Failed to update lead' };
    }
  }

  /**
   * Qualify a lead (move to qualified status)
   */
  async qualifyLead(leadId: string, qualificationData: {
    qualification_notes?: string;
    pain_points?: string[];
    decision_timeline?: string;
    decision_makers?: Record<string, any>;
  }): Promise<CRMServiceResponse<CRMLead>> {
    try {
      const updates = {
        ...qualificationData,
        lead_status: 'qualified',
        last_contact_date: new Date().toISOString()
      };

      return await this.updateLead(leadId, updates);
    } catch (error) {
      console.error('Error in qualifyLead:', error);
      return { success: false, error: 'Failed to qualify lead' };
    }
  }

  /**
   * Assign a lead to a sales rep
   */
  async assignLead(leadId: string, assignedTo: string): Promise<CRMServiceResponse<CRMLead>> {
    try {
      return await this.updateLead(leadId, { assigned_to: assignedTo });
    } catch (error) {
      console.error('Error in assignLead:', error);
      return { success: false, error: 'Failed to assign lead' };
    }
  }

  /**
   * Get leads by score range (for prioritization)
   */
  async getLeadsByScore(minScore: number = 70): Promise<CRMServiceResponse<CRMLead[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .gte('lead_score', minScore)
        .eq('status', 'active')
        .order('lead_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching high-score leads:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLeadsByScore:', error);
      return { success: false, error: 'Failed to fetch high-score leads' };
    }
  }

  /**
   * Get leads by source for ROI analysis
   */
  async getLeadsBySource(source: string): Promise<CRMServiceResponse<CRMLead[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('lead_source', source)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads by source:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLeadsBySource:', error);
      return { success: false, error: 'Failed to fetch leads by source' };
    }
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp(): Promise<CRMServiceResponse<CRMLead[]>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .lte('next_follow_up_date', today)
        .eq('status', 'active')
        .not('next_follow_up_date', 'is', null)
        .order('next_follow_up_date', { ascending: true });

      if (error) {
        console.error('Error fetching leads requiring follow-up:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLeadsRequiringFollowUp:', error);
      return { success: false, error: 'Failed to fetch leads requiring follow-up' };
    }
  }

  /**
   * Bulk import leads from CSV data
   */
  async bulkImportLeads(csvData: string): Promise<CRMServiceResponse<{ imported: number; failed: number; errors: string[] }>> {
    try {
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const results = { imported: 0, failed: 0, errors: [] as string[] };

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.trim());
          const leadData: Partial<CreateLeadData> = {};

          // Map CSV columns to lead fields
          headers.forEach((header, index) => {
            const value = values[index];
            if (!value) return;

            switch (header.toLowerCase()) {
              case 'email':
                leadData.email = value;
                break;
              case 'first_name':
                leadData.first_name = value;
                break;
              case 'last_name':
                leadData.last_name = value;
                break;
              case 'company_name':
                leadData.company_name = value;
                break;
              case 'phone':
                leadData.phone = value;
                break;
              case 'lead_type':
                if (['individual', 'corporate', 'potential_ap'].includes(value)) {
                  leadData.lead_type = value as 'individual' | 'corporate' | 'potential_ap';
                }
                break;
              case 'lead_source':
                leadData.lead_source = value;
                break;
              case 'industry':
                leadData.industry = value;
                break;
              case 'city':
                leadData.city = value;
                break;
              case 'province':
                leadData.province = value;
                break;
            }
          });

          // Validate required fields
          if (!leadData.email || !leadData.lead_type || !leadData.lead_source) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Missing required fields (email, lead_type, lead_source)`);
            continue;
          }

          const createResult = await this.createLead(leadData as CreateLeadData);
          if (createResult.success) {
            results.imported++;
          } else {
            results.failed++;
            results.errors.push(`Row ${i + 1}: ${createResult.error}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Error in bulkImportLeads:', error);
      return { success: false, error: 'Failed to import leads' };
    }
  }

  /**
   * Calculate lead score based on various factors
   */
  private calculateLeadScore(leadData: Partial<CRMLead | CreateLeadData>): number {
    let score = 0;

    // Urgency scoring
    if (leadData.training_urgency) {
      score += this.leadScoringConfig.urgency_weights[leadData.training_urgency] || 0;
    }

    // Company size scoring (for corporate leads)
    if (leadData.lead_type === 'corporate' && leadData.company_size) {
      score += this.leadScoringConfig.company_size_weights[leadData.company_size] || 0;
    }

    // Contact quality scoring
    if (leadData.phone && leadData.email) {
      score += this.leadScoringConfig.contact_quality_weights.has_phone_and_email;
    }
    if (leadData.company_name) {
      score += this.leadScoringConfig.contact_quality_weights.has_company_name;
    }
    if (leadData.job_title) {
      score += this.leadScoringConfig.contact_quality_weights.has_job_title;
    }

    // Volume scoring
    if (leadData.estimated_participant_count) {
      const volumeScore = leadData.estimated_participant_count * this.leadScoringConfig.volume_weights.participant_count_multiplier;
      score += Math.min(volumeScore, this.leadScoringConfig.volume_weights.max_volume_score);
    }

    // Industry scoring
    if (leadData.industry) {
      score += this.leadScoringConfig.industry_weights[leadData.industry.toLowerCase()] || 
               this.leadScoringConfig.industry_weights.other;
    }

    // Geographic scoring (Ontario gets priority)
    if (leadData.province === 'ON' || leadData.province === 'Ontario') {
      score += 15;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Auto-assign lead to available sales rep
   */
  private async autoAssignLead(leadId: string): Promise<void> {
    try {
      const { data } = await supabase.rpc('auto_assign_lead', { lead_id: leadId });
      console.log('Lead auto-assigned:', data);
    } catch (error) {
      console.error('Error auto-assigning lead:', error);
    }
  }

  /**
   * Trigger lead automation workflows
   */
  private async triggerLeadAutomation(leadId: string): Promise<void> {
    try {
      // This would trigger various automation workflows
      // For now, we'll implement basic follow-up task creation
      const leadResponse = await this.getLead(leadId);
      if (!leadResponse.success || !leadResponse.data) return;

      const lead = leadResponse.data;

      // Create follow-up task based on lead score
      if (lead.lead_score >= 70) {
        // High priority follow-up within 24 hours
        const followUpDate = new Date();
        followUpDate.setHours(followUpDate.getHours() + 24);

        await supabase.from('crm_tasks').insert({
          lead_id: leadId,
          task_title: `High Priority Follow-up: ${lead.first_name} ${lead.last_name || ''} - ${lead.company_name || ''}`,
          description: `High-score lead (${lead.lead_score}) requires immediate follow-up. Lead type: ${lead.lead_type}`,
          task_type: 'follow_up',
          priority: 'high',
          due_date: followUpDate.toISOString(),
          assigned_to: lead.assigned_to,
          created_by: lead.created_by
        });
      } else if (lead.lead_score >= 40) {
        // Standard follow-up within 3 days
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3);

        await supabase.from('crm_tasks').insert({
          lead_id: leadId,
          task_title: `Follow-up: ${lead.first_name} ${lead.last_name || ''} - ${lead.company_name || ''}`,
          description: `Medium-score lead (${lead.lead_score}) requires follow-up. Lead type: ${lead.lead_type}`,
          task_type: 'follow_up',
          priority: 'medium',
          due_date: followUpDate.toISOString(),
          assigned_to: lead.assigned_to,
          created_by: lead.created_by
        });
      }

      // Update lead with next follow-up date
      const nextFollowUp = new Date();
      if (lead.lead_score >= 70) {
        nextFollowUp.setHours(nextFollowUp.getHours() + 24);
      } else if (lead.lead_score >= 40) {
        nextFollowUp.setDate(nextFollowUp.getDate() + 3);
      } else {
        nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      }

      await this.updateLead(leadId, {
        next_follow_up_date: nextFollowUp.toISOString()
      });

    } catch (error) {
      console.error('Error triggering lead automation:', error);
    }
  }

  /**
   * Check if lead score should be recalculated
   */
  private shouldRecalculateScore(updates: Partial<CRMLead>): boolean {
    const scoreRelevantFields = [
      'training_urgency', 'company_size', 'phone', 'company_name', 
      'job_title', 'estimated_participant_count', 'industry', 'province'
    ];
    
    return scoreRelevantFields.some(field => field in updates);
  }
}

export const crmLeadService = new CRMLeadService();