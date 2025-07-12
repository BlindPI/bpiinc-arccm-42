import { supabase } from '@/integrations/supabase/client';

export class ComplianceRequirementsService {
  static async initializeDefaultRequirements(userId: string, role: string) {
    // Initialize default compliance requirements based on user role
    const defaultRequirements = this.getDefaultRequirementsByRole(role);
    
    for (const requirement of defaultRequirements) {
await supabase
  .from('user_compliance_records')
  .upsert({
    user_id: userId,
    metric_id: requirement.metric_id,
    compliance_status: 'non_compliant',
    target_date: requirement.target_date
  }, { 
    onConflict: 'user_id,metric_id',
    ignoreDuplicates: true 
  });
    }
    
    return true;
  }

  private static getDefaultRequirementsByRole(role: string) {
    const baseRequirements = [
      {
        metric_id: 'training_completion',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      },
      {
        metric_id: 'certification_update', 
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      }
    ];

    // Add role-specific requirements
    if (role === 'AP') {
      baseRequirements.push({
        metric_id: 'provider_documentation',
        target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
      });
    }

    return baseRequirements;
  }
}