
import { supabase } from '@/integrations/supabase/client';

export interface TemplateAvailability {
  exists: boolean;
  url?: string;
}

/**
 * Checks if a template file exists in the specified Supabase storage bucket
 * @param bucketName - Name of the Supabase storage bucket
 * @param fileName - Name of the file to check
 * @returns Promise with existence status and URL if available
 */
export async function checkTemplateAvailability(bucketName: string, fileName: string): Promise<TemplateAvailability> {
  try {
    // Check if the file exists in storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 100,
        search: fileName
      });
    
    if (error) {
      console.error('Error checking template existence:', error);
      return { exists: false };
    }
    
    // Check if any file matches the template name
    const fileExists = data && data.length > 0 && data.some(file => file.name === fileName);
    
    if (!fileExists) {
      return { exists: false };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return { 
      exists: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Exception checking template:', error);
    return { exists: false };
  }
}

/**
 * Gets a fallback local URL for a template if the Supabase one is not available
 * @param templateName - Name of the template file
 * @returns Local URL to the template file
 */
export function getLocalTemplateUrl(templateName: string): string {
  return `/templates/${templateName}`;
}
