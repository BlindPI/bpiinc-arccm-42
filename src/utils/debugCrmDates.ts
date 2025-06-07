
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Opportunity } from '@/types/crm';

interface DateValidationResult {
  entity: string;
  id: string;
  field: string;
  value: string | null;
  isValid: boolean;
  parsedDate: Date | null;
  issues: string[];
}

export class CRMDateDebugger {
  static async validateAllDates(): Promise<{
    leads: DateValidationResult[];
    opportunities: DateValidationResult[];
    summary: {
      totalChecked: number;
      validDates: number;
      invalidDates: number;
      nullDates: number;
    };
  }> {
    console.log('Starting CRM date validation...');
    
    const leadResults = await this.validateLeadDates();
    const opportunityResults = await this.validateOpportunityDates();
    
    const allResults = [...leadResults, ...opportunityResults];
    const summary = {
      totalChecked: allResults.length,
      validDates: allResults.filter(r => r.isValid).length,
      invalidDates: allResults.filter(r => !r.isValid && r.value !== null).length,
      nullDates: allResults.filter(r => r.value === null).length
    };
    
    return {
      leads: leadResults,
      opportunities: opportunityResults,
      summary
    };
  }
  
  private static async validateLeadDates(): Promise<DateValidationResult[]> {
    try {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('id, created_at, updated_at, conversion_date, last_activity_date');
      
      if (error) {
        console.error('Error fetching leads:', error);
        return [];
      }
      
      const results: DateValidationResult[] = [];
      
      leads?.forEach((lead: any) => {
        const dateFields = ['created_at', 'updated_at', 'conversion_date', 'last_activity_date'];
        
        dateFields.forEach(field => {
          const value = lead[field];
          const validation = this.validateDateString(value);
          
          results.push({
            entity: 'lead',
            id: lead.id,
            field,
            value,
            isValid: validation.isValid,
            parsedDate: validation.parsedDate,
            issues: validation.issues
          });
        });
      });
      
      return results;
    } catch (error) {
      console.error('Error validating lead dates:', error);
      return [];
    }
  }
  
  private static async validateOpportunityDates(): Promise<DateValidationResult[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('id, created_at, updated_at, close_date, last_activity_date');
      
      if (error) {
        console.error('Error fetching opportunities:', error);
        return [];
      }
      
      const results: DateValidationResult[] = [];
      
      opportunities?.forEach((opportunity: any) => {
        const dateFields = ['created_at', 'updated_at', 'close_date', 'last_activity_date'];
        
        dateFields.forEach(field => {
          const value = opportunity[field];
          const validation = this.validateDateString(value);
          
          results.push({
            entity: 'opportunity',
            id: opportunity.id,
            field,
            value,
            isValid: validation.isValid,
            parsedDate: validation.parsedDate,
            issues: validation.issues
          });
        });
      });
      
      return results;
    } catch (error) {
      console.error('Error validating opportunity dates:', error);
      return [];
    }
  }
  
  private static validateDateString(dateString: string | null): {
    isValid: boolean;
    parsedDate: Date | null;
    issues: string[];
  } {
    if (dateString === null || dateString === undefined) {
      return {
        isValid: true, // null dates are valid (optional fields)
        parsedDate: null,
        issues: []
      };
    }
    
    const issues: string[] = [];
    let parsedDate: Date | null = null;
    let isValid = false;
    
    try {
      parsedDate = new Date(dateString);
      
      if (isNaN(parsedDate.getTime())) {
        issues.push('Invalid date format');
      } else {
        isValid = true;
        
        // Additional validations
        const now = new Date();
        const yearDiff = now.getFullYear() - parsedDate.getFullYear();
        
        if (yearDiff > 100) {
          issues.push('Date is more than 100 years old');
        }
        
        if (parsedDate > now) {
          const daysDiff = Math.ceil((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 365) {
            issues.push('Date is more than 1 year in the future');
          }
        }
      }
    } catch (error) {
      issues.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      isValid: isValid && issues.length === 0,
      parsedDate,
      issues
    };
  }
  
  static async fixInvalidDates(): Promise<{
    fixed: number;
    failed: number;
    details: string[];
  }> {
    console.log('Attempting to fix invalid dates...');
    
    const results = await this.validateAllDates();
    const invalidResults = [
      ...results.leads.filter(r => !r.isValid && r.value !== null),
      ...results.opportunities.filter(r => !r.isValid && r.value !== null)
    ];
    
    let fixed = 0;
    let failed = 0;
    const details: string[] = [];
    
    for (const result of invalidResults) {
      try {
        // Attempt to fix the date by setting it to current time
        const tableName = result.entity === 'lead' ? 'crm_leads' : 'crm_opportunities';
        const { error } = await supabase
          .from(tableName as any)
          .update({ [result.field]: new Date().toISOString() })
          .eq('id', result.id);
        
        if (error) {
          failed++;
          details.push(`Failed to fix ${result.entity} ${result.id}.${result.field}: ${error.message}`);
        } else {
          fixed++;
          details.push(`Fixed ${result.entity} ${result.id}.${result.field}`);
        }
      } catch (error) {
        failed++;
        details.push(`Exception fixing ${result.entity} ${result.id}.${result.field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return { fixed, failed, details };
  }
}
