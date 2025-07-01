
export type AutomationRuleType = 'compliance' | 'certificate' | 'notification' | 'progression';

export interface AutomationRule {
  id: string;
  name: string;
  rule_type: AutomationRuleType;
  description?: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
