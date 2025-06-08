
import { supabase } from '@/integrations/supabase/client';
import type { EmergencyContact } from '@/types/enhanced-team-management';

export class EmergencyContactsService {
  static async getUserEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }
  }

  static async addEmergencyContact(contact: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
    try {
      // If this is being set as primary, unset other primary contacts first
      if (contact.is_primary && contact.user_id) {
        await this.unsetPrimaryContacts(contact.user_id);
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      return null;
    }
  }

  static async updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
    try {
      // If setting as primary, unset other primary contacts first
      if (updates.is_primary) {
        const contact = await this.getEmergencyContact(contactId);
        if (contact?.user_id) {
          await this.unsetPrimaryContacts(contact.user_id, contactId);
        }
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      return null;
    }
  }

  static async deleteEmergencyContact(contactId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      return false;
    }
  }

  private static async getEmergencyContact(contactId: string): Promise<EmergencyContact | null> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching emergency contact:', error);
      return null;
    }
  }

  private static async unsetPrimaryContacts(userId: string, excludeId?: string): Promise<void> {
    try {
      let query = supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error unsetting primary contacts:', error);
    }
  }
}

export const emergencyContactsService = new EmergencyContactsService();
