import { CRMNavigationService } from '@/services/navigation/crmNavigationService';

/**
 * Initialize CRM navigation defaults in the existing navigation system
 * This function should be called once to set up CRM navigation for all roles
 */
export async function initializeCRMNavigation() {
  try {
    console.log('🔧 INIT: Initializing CRM navigation defaults...');
    await CRMNavigationService.initializeCRMNavigationDefaults();
    console.log('✅ INIT: CRM navigation defaults initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ INIT: Failed to initialize CRM navigation:', error);
    return { success: false, error };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).initializeCRMNavigation = initializeCRMNavigation;
  console.log('🔧 INIT: CRM navigation initialization utility loaded');
  console.log('Run initializeCRMNavigation() in console to set up CRM navigation');
}