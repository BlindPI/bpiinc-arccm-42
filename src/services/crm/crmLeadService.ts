
import { supabase } from '@/integrations/supabase/client';

export interface CRMLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_source: string;
  lead_status: string;
  lead_score: number;
  training_urgency?: string;
  estimated_participant_count?: number;
  conversion_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadScoringResult {
  leadId: string;
  score: number;
  factors: Array<{
    category: string;
    points: number;
    reason: string;
  }>;
}

export class CRMLeadService {
  // Calculate enhanced lead score using backend function
  static async calculateLeadScore(leadId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_enhanced_lead_score', {
        p_lead_id: leadId
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating lead score:', error);
      throw error;
    }
  }

  // Intelligent lead assignment using backend function
  static async assignLeadIntelligently(
    leadId: string, 
    assignmentCriteria: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('assign_lead_intelligent', {
        p_lead_id: leadId,
        p_assignment_criteria: assignmentCriteria
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning lead intelligently:', error);
      throw error;
    }
  }

  // Automatic lead qualification using backend function
  static async qualifyLeadAutomatically(leadId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('qualify_lead_automatically', {
        p_lead_id: leadId
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error qualifying lead automatically:', error);
      throw error;
    }
  }

  // Execute lead workflow using backend function
  static async executeLeadWorkflow(workflowId: string, leadId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('execute_lead_workflow', {
        p_workflow_id: workflowId,
        p_lead_id: leadId
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error executing lead workflow:', error);
      throw error;
    }
  }

  // Auto-convert qualified leads using backend function
  static async autoConvertQualifiedLeads(): Promise<void> {
    try {
      const { error } = await supabase.rpc('auto_convert_qualified_leads');
      
      if (error) throw error;
    } catch (error) {
      console.error('Error auto-converting qualified leads:', error);
      throw error;
    }
  }

  // Get all leads with enhanced data
  static async getAllLeads(): Promise<CRMLead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  // Create new lead with automatic scoring
  static async createLead(leadData: Partial<CRMLead>): Promise<CRMLead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Automatically calculate lead score
      if (data.id) {
        await this.calculateLeadScore(data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  // Update lead and recalculate score
  static async updateLead(leadId: string, updates: Partial<CRMLead>): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update(updates)
        .eq('id', leadId);
      
      if (error) throw error;
      
      // Recalculate lead score after update
      await this.calculateLeadScore(leadId);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  // Get lead scoring breakdown
  static async getLeadScoringBreakdown(leadId: string): Promise<LeadScoringResult> {
    try {
      // Get the lead data
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (leadError) throw leadError;
      
      // Calculate score
      const score = await this.calculateLeadScore(leadId);
      
      // Return detailed breakdown
      return {
        leadId,
        score,
        factors: [
          {
            category: 'Lead Source',
            points: this.getSourcePoints(lead.lead_source),
            reason: `Source: ${lead.lead_source}`
          },
          {
            category: 'Contact Quality',
            points: this.getContactQualityPoints(lead),
            reason: 'Email and phone completeness'
          },
          {
            category: 'Training Urgency',
            points: this.getUrgencyPoints(lead.training_urgency),
            reason: `Urgency: ${lead.training_urgency || 'not specified'}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting lead scoring breakdown:', error);
      throw error;
    }
  }

  private static getSourcePoints(source: string): number {
    const sourcePoints: Record<string, number> = {
      'referral': 30,
      'website': 25,
      'social_media': 20,
      'email': 15,
      'cold_call': 10,
      'trade_show': 25
    };
    return sourcePoints[source] || 5;
  }

  private static getContactQualityPoints(lead: any): number {
    let points = 0;
    if (lead.email) points += 10;
    if (lead.phone) points += 5;
    if (lead.company_name) points += 3;
    if (lead.job_title) points += 2;
    return points;
  }

  private static getUrgencyPoints(urgency: string): number {
    const urgencyPoints: Record<string, number> = {
      'immediate': 25,
      'within_month': 20,
      'within_quarter': 15,
      'planning': 10
    };
    return urgencyPoints[urgency] || 5;
  }
}
