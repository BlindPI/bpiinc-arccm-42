
import { supabase } from '@/integrations/supabase/client';

export interface CRMNavigationItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  requiredRoles: string[];
  requiredPermissions?: string[];
}

export interface CRMNavigationConfig {
  isEnabled: boolean;
  visibleGroups: string[];
  visibleItems: CRMNavigationItem[];
}

export class CRMNavigationService {
  // Define all CRM navigation items with their configurations
  private static readonly allCRMItems: CRMNavigationItem[] = [
    {
      id: 'crm-dashboard',
      name: 'CRM Dashboard',
      path: '/crm',
      icon: 'Briefcase',
      description: 'Overview of CRM metrics and activities',
      requiredRoles: ['SA', 'AD', 'AP', 'IC']
    },
    {
      id: 'lead-management',
      name: 'Lead Management',
      path: '/crm/leads',
      icon: 'UserPlus',
      description: 'Manage leads and prospects',
      requiredRoles: ['SA', 'AD', 'AP', 'IC']
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      path: '/crm/opportunities',
      icon: 'Target',
      description: 'Track sales opportunities',
      requiredRoles: ['SA', 'AD', 'AP', 'IC']
    },
    {
      id: 'activities',
      name: 'Activities',
      path: '/crm/activities',
      icon: 'Activity',
      description: 'Manage tasks and activities',
      requiredRoles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
    },
    {
      id: 'revenue-analytics',
      name: 'Revenue Analytics',
      path: '/crm/revenue',
      icon: 'DollarSign',
      description: 'Revenue analysis and reporting',
      requiredRoles: ['SA', 'AD', 'AP']
    }
  ];

  static async getCRMNavigationConfig(userRole: string): Promise<CRMNavigationConfig> {
    try {
      console.log('🔧 CRM-NAV: Getting CRM navigation config for role:', userRole);
      
      // Get navigation configuration from system_configurations table
      const { data: configs, error } = await supabase
        .from('system_configurations')
        .select('key, value')
        .eq('category', 'navigation')
        .in('key', ['visibility', `visibility_${userRole}`]);

      if (error) {
        console.error('🔧 CRM-NAV: Error fetching navigation config:', error);
        return { isEnabled: false, visibleGroups: [], visibleItems: [] };
      }

      // Check master config first, then role-specific config
      let navigationConfig = null;
      const masterConfig = configs?.find(c => c.key === 'visibility');
      if (masterConfig?.value && typeof masterConfig.value === 'object') {
        const allRolesConfig = masterConfig.value as Record<string, any>;
        navigationConfig = allRolesConfig[userRole];
      }

      // Fall back to role-specific config
      if (!navigationConfig) {
        const roleConfig = configs?.find(c => c.key === `visibility_${userRole}`);
        navigationConfig = roleConfig?.value;
      }

      if (!navigationConfig || typeof navigationConfig !== 'object') {
        console.log('🔧 CRM-NAV: No navigation config found for role:', userRole);
        return { isEnabled: false, visibleGroups: [], visibleItems: [] };
      }

      // Check if CRM group is enabled
      const crmGroup = navigationConfig['CRM'];
      if (!crmGroup || !crmGroup.enabled) {
        console.log('🔧 CRM-NAV: CRM group not enabled for role:', userRole);
        return { isEnabled: false, visibleGroups: [], visibleItems: [] };
      }

      // Filter items based on visibility and role requirements
      const visibleItems = this.allCRMItems.filter(item => {
        const hasRoleAccess = item.requiredRoles.includes(userRole);
        const isItemVisible = crmGroup.items && crmGroup.items[item.name] === true;
        const isVisible = hasRoleAccess && isItemVisible;
        
        console.log('🔧 CRM-NAV: Item check:', {
          item: item.name,
          hasRoleAccess,
          isItemVisible,
          isVisible
        });
        
        return isVisible;
      });

      console.log('🔧 CRM-NAV: Final config:', {
        isEnabled: true,
        visibleItemsCount: visibleItems.length,
        visibleItems: visibleItems.map(i => i.name)
      });

      return {
        isEnabled: true,
        visibleGroups: ['CRM'],
        visibleItems
      };
    } catch (error) {
      console.error('🔧 CRM-NAV: Error getting CRM navigation config:', error);
      return { isEnabled: false, visibleGroups: [], visibleItems: [] };
    }
  }

  static async updateCRMNavigationVisibility(
    role: string,
    itemName: string,
    isVisible: boolean
  ): Promise<void> {
    try {
      console.log('🔧 CRM-NAV: Updating visibility:', { role, itemName, isVisible });
      
      // Get current navigation configuration
      const { data: configs, error: fetchError } = await supabase
        .from('system_configurations')
        .select('key, value')
        .eq('category', 'navigation')
        .in('key', ['visibility', `visibility_${role}`]);

      if (fetchError) {
        throw fetchError;
      }

      // Try to update master config first
      const masterConfig = configs?.find(c => c.key === 'visibility');
      if (masterConfig?.value && typeof masterConfig.value === 'object') {
        const allRolesConfig = masterConfig.value as Record<string, any>;
        if (allRolesConfig[role]) {
          // Update master config
          if (!allRolesConfig[role]['CRM']) {
            allRolesConfig[role]['CRM'] = { enabled: true, items: {} };
          }
          allRolesConfig[role]['CRM'].items[itemName] = isVisible;

          const { error: updateError } = await supabase
            .from('system_configurations')
            .update({
              value: allRolesConfig,
              updated_at: new Date().toISOString()
            })
            .eq('category', 'navigation')
            .eq('key', 'visibility');

          if (updateError) throw updateError;
          return;
        }
      }

      // Fall back to role-specific config
      const roleConfigKey = `visibility_${role}`;
      const roleConfig = configs?.find(c => c.key === roleConfigKey);
      
      if (roleConfig?.value && typeof roleConfig.value === 'object') {
        const config = roleConfig.value as Record<string, any>;
        if (!config['CRM']) {
          config['CRM'] = { enabled: true, items: {} };
        }
        config['CRM'].items[itemName] = isVisible;

        const { error: updateError } = await supabase
          .from('system_configurations')
          .update({
            value: config,
            updated_at: new Date().toISOString()
          })
          .eq('category', 'navigation')
          .eq('key', roleConfigKey);

        if (updateError) throw updateError;
      } else {
        throw new Error(`No navigation configuration found for role: ${role}`);
      }
    } catch (error) {
      console.error('🔧 CRM-NAV: Error updating CRM navigation visibility:', error);
      throw error;
    }
  }

  static async initializeCRMNavigationDefaults(): Promise<void> {
    try {
      console.log('🔧 CRM-NAV: Initializing CRM navigation defaults');
      
      const roles = ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN'];
      const crmItemDefaults = {
        'CRM Dashboard': { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false },
        'Lead Management': { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false },
        'Opportunities': { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false },
        'Activities': { SA: true, AD: true, AP: true, IC: true, IP: true, IT: true, IN: false },
        'Revenue Analytics': { SA: true, AD: true, AP: true, IC: false, IP: false, IT: false, IN: false }
      };

      // Try to update master config first
      const { data: masterConfig, error: fetchError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('category', 'navigation')
        .eq('key', 'visibility')
        .single();

      if (!fetchError && masterConfig?.value && typeof masterConfig.value === 'object') {
        const allRolesConfig = masterConfig.value as Record<string, any>;
        
        for (const role of roles) {
          if (!allRolesConfig[role]) {
            allRolesConfig[role] = {};
          }
          
          const groupVisible = ['SA', 'AD', 'AP', 'IC'].includes(role);
          allRolesConfig[role]['CRM'] = {
            enabled: groupVisible,
            items: {}
          };

          // Set individual item visibility
          for (const [itemName, roleDefaults] of Object.entries(crmItemDefaults)) {
            const isVisible = roleDefaults[role as keyof typeof roleDefaults] || false;
            allRolesConfig[role]['CRM'].items[itemName] = isVisible;
          }
        }

        const { error: updateError } = await supabase
          .from('system_configurations')
          .update({
            value: allRolesConfig,
            updated_at: new Date().toISOString()
          })
          .eq('category', 'navigation')
          .eq('key', 'visibility');

        if (updateError) throw updateError;
        console.log('🔧 CRM-NAV: Successfully updated master config with CRM defaults');
        return;
      }

      // Fall back to individual role configs
      for (const role of roles) {
        const roleConfigKey = `visibility_${role}`;
        const { data: roleConfig, error: roleError } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('category', 'navigation')
          .eq('key', roleConfigKey)
          .single();

        if (!roleError && roleConfig?.value && typeof roleConfig.value === 'object') {
          const config = roleConfig.value as Record<string, any>;
          
          const groupVisible = ['SA', 'AD', 'AP', 'IC'].includes(role);
          config['CRM'] = {
            enabled: groupVisible,
            items: {}
          };

          // Set individual item visibility
          for (const [itemName, roleDefaults] of Object.entries(crmItemDefaults)) {
            const isVisible = roleDefaults[role as keyof typeof roleDefaults] || false;
            config['CRM'].items[itemName] = isVisible;
          }

          const { error: updateError } = await supabase
            .from('system_configurations')
            .update({
              value: config,
              updated_at: new Date().toISOString()
            })
            .eq('category', 'navigation')
            .eq('key', roleConfigKey);

          if (updateError) {
            console.error(`🔧 CRM-NAV: Error updating config for role ${role}:`, updateError);
          }
        }
      }

      console.log('🔧 CRM-NAV: Successfully initialized CRM navigation defaults');
    } catch (error) {
      console.error('🔧 CRM-NAV: Error initializing CRM navigation defaults:', error);
      throw error;
    }
  }

  static getAllCRMItems(): CRMNavigationItem[] {
    return [...this.allCRMItems];
  }
}
