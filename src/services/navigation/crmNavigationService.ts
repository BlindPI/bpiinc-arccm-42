
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
  static async getCRMNavigationConfig(userRole: string): Promise<CRMNavigationConfig> {
    try {
      // Check if CRM group is visible for user's role
      const { data: groupVisibility, error: groupError } = await supabase
        .from('navigation_visibility')
        .select('is_visible')
        .eq('role', userRole)
        .eq('group_name', 'CRM')
        .single();

      if (groupError || !groupVisibility?.is_visible) {
        return { isEnabled: false, visibleGroups: [], visibleItems: [] };
      }

      // Get visible CRM items for the user's role
      const { data: itemsVisibility, error: itemsError } = await supabase
        .from('navigation_visibility')
        .select('item_name, is_visible')
        .eq('role', userRole)
        .eq('group_name', 'CRM')
        .eq('is_visible', true);

      if (itemsError) {
        console.error('Error fetching CRM navigation items:', itemsError);
        return { isEnabled: false, visibleGroups: [], visibleItems: [] };
      }

      // Define all CRM navigation items with their configurations
      const allCRMItems: CRMNavigationItem[] = [
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

      // Filter items based on visibility and role requirements
      const visibleItems = allCRMItems.filter(item => {
        const hasRoleAccess = item.requiredRoles.includes(userRole);
        const isItemVisible = itemsVisibility?.some(iv => iv.item_name === item.name);
        return hasRoleAccess && isItemVisible;
      });

      return {
        isEnabled: true,
        visibleGroups: ['CRM'],
        visibleItems
      };
    } catch (error) {
      console.error('Error getting CRM navigation config:', error);
      return { isEnabled: false, visibleGroups: [], visibleItems: [] };
    }
  }

  static async updateCRMNavigationVisibility(
    role: string,
    itemName: string,
    isVisible: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('navigation_visibility')
        .upsert({
          role,
          group_name: 'CRM',
          item_name: itemName,
          is_visible: isVisible,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'role,group_name,item_name'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating CRM navigation visibility:', error);
      throw error;
    }
  }

  static async initializeCRMNavigationDefaults(): Promise<void> {
    try {
      const roles = ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN'];
      const crmItems = [
        { name: 'CRM Dashboard', defaultVisibility: { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false } },
        { name: 'Lead Management', defaultVisibility: { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false } },
        { name: 'Opportunities', defaultVisibility: { SA: true, AD: true, AP: true, IC: true, IP: false, IT: false, IN: false } },
        { name: 'Activities', defaultVisibility: { SA: true, AD: true, AP: true, IC: true, IP: true, IT: true, IN: false } },
        { name: 'Revenue Analytics', defaultVisibility: { SA: true, AD: true, AP: true, IC: false, IP: false, IT: false, IN: false } }
      ];

      for (const role of roles) {
        // Set CRM group visibility
        const groupVisible = role === 'SA' || role === 'AD' || role === 'AP' || role === 'IC';
        
        await supabase
          .from('navigation_visibility')
          .upsert({
            role,
            group_name: 'CRM',
            item_name: null,
            is_visible: groupVisible,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'role,group_name,item_name'
          });

        // Set individual item visibility
        for (const item of crmItems) {
          const isVisible = item.defaultVisibility[role as keyof typeof item.defaultVisibility] || false;
          
          await supabase
            .from('navigation_visibility')
            .upsert({
              role,
              group_name: 'CRM',
              item_name: item.name,
              is_visible: isVisible,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'role,group_name,item_name'
            });
        }
      }
    } catch (error) {
      console.error('Error initializing CRM navigation defaults:', error);
      throw error;
    }
  }
}
