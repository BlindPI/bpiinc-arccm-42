
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Template metadata structure
export interface TemplateVersion {
  id: string;
  name: string;
  version: string;
  created_at: string;
  is_default: boolean;
  url: string;
  created_by: string;
}

// Get all template versions
export const getTemplateVersions = async () => {
  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching template versions:', error);
    throw error;
  }
};

// Get the default template
export const getDefaultTemplate = async () => {
  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching default template:', error);
    
    // Fallback to fetch the most recent template
    try {
      const { data, error: fallbackError } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fallbackError) throw fallbackError;
      return data;
    } catch (fallbackError) {
      console.error('Error fetching fallback template:', fallbackError);
      throw new Error('No certificate template available');
    }
  }
};

// Set a template as default
export const setDefaultTemplate = async (templateId: string) => {
  try {
    // First, unset all templates as default
    const { error: resetError } = await supabase
      .from('certificate_templates')
      .update({ is_default: false })
      .not('id', 'eq', templateId);
    
    if (resetError) throw resetError;
    
    // Then set the selected template as default
    const { error } = await supabase
      .from('certificate_templates')
      .update({ is_default: true })
      .eq('id', templateId);
    
    if (error) throw error;
    
    toast.success('Default template updated successfully');
    return true;
  } catch (error) {
    console.error('Error setting default template:', error);
    toast.error('Failed to update default template');
    throw error;
  }
};

// Upload a new template version
export const uploadTemplateVersion = async (file: File, name: string, version: string) => {
  try {
    const profileId = (await supabase.auth.getUser()).data.user?.id;
    if (!profileId) throw new Error('User not authenticated');
    
    // Upload file to storage
    const fileName = `template-${version}-${Date.now()}.pdf`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('certificate-template')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificate-template')
      .getPublicUrl(fileName);
    
    // Store metadata in database
    const { error: dbError } = await supabase
      .from('certificate_templates')
      .insert({
        name,
        version,
        url: publicUrl,
        created_by: profileId,
        is_default: false
      });
    
    if (dbError) throw dbError;
    
    toast.success('Template uploaded successfully');
    return { publicUrl, fileName };
  } catch (error) {
    console.error('Error uploading template:', error);
    toast.error('Failed to upload template');
    throw error;
  }
};
