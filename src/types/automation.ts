
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'compliance' | 'certificate' | 'notification' | 'progression';
  type: string;
  trigger_conditions: Record<string, any>;
  trigger: { type: string; parameters: Record<string, any> };
  actions: { type: string; parameters: Record<string, any> }[];
  is_active: boolean;
  isActive: boolean;
  execution_count?: number;
  last_executed?: string;
  created_by?: string;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

export interface RuleFormData {
  name: string;
  description: string;
  rule_type: 'compliance' | 'certificate' | 'notification' | 'progression';
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
}
