
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'compliance' | 'certificate' | 'notification' | 'progression';
  trigger_conditions: Record<string, any>; // JSONB field properly typed
  actions: Record<string, any>; // JSONB field properly typed
  is_active: boolean;
  execution_count?: number;
  last_executed?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleFormData {
  name: string;
  description: string;
  rule_type: 'compliance' | 'certificate' | 'notification' | 'progression';
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
}
