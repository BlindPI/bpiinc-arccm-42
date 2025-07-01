
// Consolidated automation types
export interface EnhancedAutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'notification' | 'assignment' | 'escalation' | 'report';
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Database compatibility
  rule_type: string;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_by: string;
  execution_count: number;
  last_executed: string;
}

export interface RuleFormData {
  name: string;
  description: string;
  type: 'notification' | 'assignment' | 'escalation' | 'report';
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  created_by: string;
}
