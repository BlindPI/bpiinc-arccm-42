
import { supabase } from '@/integrations/supabase/client';

export interface TemplateVersion {
  id: string;
  name: string;
  version: string;
  url: string;
  created_at: string;
  created_by?: string;
  is_default: boolean;
}

export const getTemplateVersions = async (): Promise<TemplateVersion[]> => {
  try {
    // We need to use a generic type here because certificate_templates isn't in the type system yet
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Cast the data to TemplateVersion[] since we know the structure
    return (data || []) as TemplateVersion[];
  } catch (error) {
    console.error('Error fetching template versions:', error);
    return [];
  }
};

export const getDefaultTemplate = async (): Promise<TemplateVersion | null> => {
  try {
    // Use generic type for the same reason
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No default template found, get the most recent one
        const { data: recentTemplate, error: recentError } = await supabase
          .from('certificate_templates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentError) throw recentError;
        return recentTemplate as TemplateVersion;
      }
      throw error;
    }
    
    return data as TemplateVersion;
  } catch (error) {
    console.error('Error fetching default template:', error);
    return null;
  }
};

export const setDefaultTemplate = async (templateId: string): Promise<boolean> => {
  try {
    // First, set all templates to non-default with a valid WHERE clause
    const { error: updateError } = await supabase
      .from('certificate_templates')
      .update({ is_default: false })
      .gte('id', '00000000-0000-0000-0000-000000000000'); // This ensures all records are updated
    
    if (updateError) throw updateError;
    
    // Then set the selected one as default
    const { error } = await supabase
      .from('certificate_templates')
      .update({ is_default: true })
      .eq('id', templateId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error setting default template:', error);
    return false;
  }
};

export const uploadTemplateVersion = async (
  file: File,
  name: string,
  version: string
): Promise<TemplateVersion | null> => {
  try {
    // Upload file to storage
    const filePath = `templates/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificate-template')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('certificate-template')
      .getPublicUrl(uploadData.path);
    
    if (!publicUrlData) throw new Error('Failed to get public URL');
    
    // Create new template record
    const { data: templateData, error: templateError } = await supabase
      .from('certificate_templates')
      .insert({
        name,
        version,
        url: publicUrlData.publicUrl,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (templateError) throw templateError;
    
    return templateData as TemplateVersion;
  } catch (error) {
    console.error('Error uploading template:', error);
    return null;
  }
};
