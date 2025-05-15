
import { supabase } from '@/integrations/supabase/client';

export interface TemplateAvailability {
  exists: boolean;
  url?: string;
  error?: {
    type: 'connection' | 'file' | 'permission';
    message: string;
  };
}

/**
 * Checks if a template file exists in the specified Supabase storage bucket
 * with enhanced error handling and verification
 * 
 * @param bucketName - Name of the Supabase storage bucket
 * @param fileName - Name of the file to check
 * @returns Promise with existence status, URL if available, and error details if applicable
 */
export async function checkTemplateAvailability(bucketName: string, fileName: string): Promise<TemplateAvailability> {
  try {
    // First verification step: check if we can access the storage service
    const { data: bucketCheck, error: bucketError } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.error(`Error accessing bucket ${bucketName}:`, bucketError);
      return { 
        exists: false, 
        error: {
          type: 'connection',
          message: `Cannot access storage: ${bucketError.message}`
        }
      };
    }
    
    // Second verification step: check if the file exists
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 100,
        search: fileName
      });
    
    if (error) {
      console.error('Error checking template existence:', error);
      return { 
        exists: false,
        error: {
          type: 'connection',
          message: `Error checking file existence: ${error.message}`
        }
      };
    }
    
    // Check if any file matches the template name
    const fileExists = data && data.length > 0 && data.some(file => file.name === fileName);
    
    if (!fileExists) {
      return { 
        exists: false,
        error: {
          type: 'file',
          message: `File '${fileName}' not found in bucket '${bucketName}'`
        }
      };
    }
    
    // Get the public URL with a cache-busting parameter
    const timestamp = new Date().getTime();
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(`${fileName}?t=${timestamp}`);
    
    if (!urlData || !urlData.publicUrl) {
      return { 
        exists: false,
        error: {
          type: 'permission',
          message: `File exists but URL could not be generated. Check bucket permissions.`
        }
      };
    }
    
    // If we got this far, the file exists and we have a URL
    return { 
      exists: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Exception checking template:', error);
    return { 
      exists: false,
      error: {
        type: 'connection',
        message: error instanceof Error ? error.message : 'Unknown error checking template'
      }
    };
  }
}

/**
 * Gets a fallback local URL for a template if the Supabase one is not available
 * @param templateName - Name of the template file
 * @returns Local URL to the template file
 */
export function getLocalTemplateUrl(templateName: string): string {
  // Add cache busting parameter to the local URL as well
  const timestamp = new Date().getTime();
  return `/templates/${templateName}?t=${timestamp}`;
}

/**
 * Adds a cache-busting parameter to a URL
 * @param url - Original URL
 * @returns URL with cache-busting parameter
 */
export function addCacheBuster(url: string): string {
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
}

/**
 * Performs a comprehensive verification of a template URL to ensure it's accessible
 * and has the correct content type
 * 
 * @param url - URL to verify
 * @param expectedType - Expected file type ('roster' or 'certificate')
 * @returns Promise with verification result
 */
export async function verifyTemplateUrl(
  url: string, 
  expectedType: 'roster' | 'certificate'
): Promise<{ valid: boolean; message: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return {
        valid: false,
        message: `Template returned HTTP status ${response.status}: ${response.statusText}`
      };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    
    // Define expected content types based on file type
    const expectedContentTypes = expectedType === 'roster'
      ? ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']
      : ['application/pdf', 'application/octet-stream'];
    
    const hasValidContentType = contentType && expectedContentTypes.some(type => contentType.includes(type));
    
    if (!hasValidContentType) {
      return {
        valid: false,
        message: `File may be corrupted or wrong format. Found content type: ${contentType || 'unknown'}`
      };
    }
    
    return {
      valid: true,
      message: 'Template verified successfully'
    };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Network error accessing template'
    };
  }
}

/**
 * Get system default template URL for a specific template type
 * @param templateType - Type of template (roster, certificate)
 * @returns Promise with template URL or null if not found
 */
export async function getSystemDefaultTemplate(templateType: 'roster' | 'certificate'): Promise<string | null> {
  try {
    // Get system settings that might contain default template configurations
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', `${templateType}_template_settings`)
      .single();
      
    if (settingsError || !settings) {
      console.log(`No default ${templateType} template configured in system settings`);
      return null;
    }
    
    // Properly type check and access the value
    const settingsValue = settings.value;
    
    // Check if settingsValue is an object with default_template_url property
    if (
      typeof settingsValue === 'object' && 
      settingsValue !== null && 
      'default_template_url' in settingsValue
    ) {
      const defaultUrl = (settingsValue as Record<string, unknown>).default_template_url;
      if (typeof defaultUrl === 'string') {
        return defaultUrl;
      }
    }
    
    console.log(`Invalid default ${templateType} template configuration`);
    return null;
  } catch (error) {
    console.error(`Error fetching default ${templateType} template:`, error);
    return null;
  }
}
