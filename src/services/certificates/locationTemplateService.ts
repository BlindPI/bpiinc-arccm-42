
import { supabase } from '@/integrations/supabase/client';

export interface LocationTemplate {
  id: string;
  location_id: string;
  template_id: string;
  is_primary: boolean;
  created_at: string;
  location_name?: string;
  template_name?: string;
}

export const getLocationTemplates = async (): Promise<LocationTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('location_templates')
      .select(`
        *,
        locations:location_id(name),
        templates:template_id(name)
      `);
    
    if (error) throw error;
    
    // Transform the data to include location and template names
    return (data || []).map(item => ({
      ...item,
      location_name: item.locations?.name,
      template_name: item.templates?.name
    }));
  } catch (error) {
    console.error('Error fetching location templates:', error);
    return [];
  }
};

export const getLocationPrimaryTemplate = async (locationId: string): Promise<string | null> => {
  try {
    console.log('Fetching primary template for location ID:', locationId);
    
    if (!locationId || locationId === 'none') {
      console.log('No location ID provided or "none" specified');
      return null;
    }
    
    // This query gets the template URL directly by joining the location_templates and certificate_templates tables
    const { data, error } = await supabase
      .from('location_templates')
      .select(`
        template_id,
        certificate_templates:template_id(url)
      `)
      .eq('location_id', locationId)
      .eq('is_primary', true)
      .single();
    
    if (error) {
      console.log('Error or no primary template found:', error.message);
      
      // If no primary template found, try to get any template for this location
      if (error.code === 'PGRST116') {
        console.log('Trying to fetch any template for this location');
        const { data: anyTemplate, error: anyTemplateError } = await supabase
          .from('location_templates')
          .select(`
            template_id,
            certificate_templates:template_id(url)
          `)
          .eq('location_id', locationId)
          .limit(1)
          .single();
        
        if (anyTemplateError) {
          console.log('No template found for location:', anyTemplateError.message);
          return null;
        }
        
        console.log('Found non-primary template for location:', anyTemplate?.certificate_templates?.url);
        return anyTemplate.certificate_templates?.url || null;
      }
      return null;
    }
    
    console.log('Found primary template for location:', data?.certificate_templates?.url);
    return data.certificate_templates?.url || null;
  } catch (error) {
    console.error('Error fetching primary template for location:', error);
    return null;
  }
};

export const assignTemplateToLocation = async (
  locationId: string,
  templateId: string,
  isPrimary: boolean = false
): Promise<boolean> => {
  try {
    // Check if this template is already assigned to this location
    const { data: existing, error: checkError } = await supabase
      .from('location_templates')
      .select('id')
      .eq('location_id', locationId)
      .eq('template_id', templateId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    // If it exists, update the is_primary flag
    if (existing) {
      const { error } = await supabase
        .from('location_templates')
        .update({ is_primary: isPrimary })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Otherwise, create a new assignment
      const { error } = await supabase
        .from('location_templates')
        .insert({
          location_id: locationId,
          template_id: templateId,
          is_primary: isPrimary
        });
      
      if (error) throw error;
    }
    
    // If setting this template as primary, make sure no other template for this location is primary
    if (isPrimary) {
      const { error: updateError } = await supabase
        .from('location_templates')
        .update({ is_primary: false })
        .eq('location_id', locationId)
        .neq('template_id', templateId);
      
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error assigning template to location:', error);
    return false;
  }
};

export const removeTemplateFromLocation = async (locationId: string, templateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('location_templates')
      .delete()
      .eq('location_id', locationId)
      .eq('template_id', templateId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing template from location:', error);
    return false;
  }
};
