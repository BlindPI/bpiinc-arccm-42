d// Settings Page Debug Utility
import { supabase } from '@/integrations/supabase/client';

export const debugSettingsPage = async () => {
  console.log('🔍 SETTINGS DEBUG: Starting comprehensive settings page diagnosis...');
  
  try {
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 SETTINGS DEBUG: Auth Status:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      authError: authError?.message
    });

    if (!user) {
      console.error('🚨 SETTINGS DEBUG: No authenticated user found!');
      return { success: false, error: 'No authenticated user' };
    }

    // Test 2: Check profile access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('🔍 SETTINGS DEBUG: Profile Status:', {
      hasProfile: !!profile,
      role: profile?.role,
      profileError: profileError?.message
    });

    // Test 3: Check system_configurations table access
    const { data: configs, error: configError } = await supabase
      .from('system_configurations')
      .select('*')
      .limit(5);
    
    console.log('🔍 SETTINGS DEBUG: System Configurations Access:', {
      hasConfigs: !!configs,
      configCount: configs?.length || 0,
      configError: configError?.message,
      configErrorCode: configError?.code
    });

    // Test 4: Check specific navigation configs
    const { data: navConfigs, error: navError } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', 'navigation');
    
    console.log('🔍 SETTINGS DEBUG: Navigation Configurations:', {
      hasNavConfigs: !!navConfigs,
      navConfigCount: navConfigs?.length || 0,
      navError: navError?.message
    });

    return {
      success: true,
      results: {
        auth: { hasUser: !!user, userId: user.id },
        profile: { hasProfile: !!profile, role: profile?.role },
        configs: { hasConfigs: !!configs, count: configs?.length },
        navigation: { hasNavConfigs: !!navConfigs, count: navConfigs?.length }
      }
    };

  } catch (error: any) {
    console.error('🚨 SETTINGS DEBUG: Unexpected error during diagnosis:', error);
    return { success: false, error: error.message };
  }
};

// Add this to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugSettings = debugSettingsPage;
}