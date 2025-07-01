
import { supabase } from '@/integrations/supabase/client';

export interface CreateRosterData {
  name: string;
  location_id: string;
  submitted_by: string;
  total_count: number;
  status: 'SUBMITTED' | 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  submitted_at: string;
  description?: string;
  course_id?: string;
  issue_date?: string;
}

export const createRoster = async (rosterData: CreateRosterData) => {
  try {
    // Let the database generate the UUID for id
    const { data, error } = await supabase
      .from('rosters')
      .insert({
        name: rosterData.name,
        description: rosterData.description,
        course_id: rosterData.course_id,
        location_id: rosterData.location_id,
        issue_date: rosterData.issue_date,
        created_by: rosterData.submitted_by,
        status: rosterData.status,
        submitted_at: rosterData.submitted_at,
        total_count: rosterData.total_count
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating roster:', error);
      return { success: false, error, data: null };
    }
    
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error creating roster:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error'),
      data: null 
    };
  }
};

export const sendBatchRosterEmails = async (
  rosterId: string, 
  recipientEmails: string[]
) => {
  try {
    console.log(`Sending batch emails for roster: ${rosterId} to ${recipientEmails.length} recipients`);
    
    // Get certificates for this roster
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('roster_id', rosterId);
      
    if (certError) throw certError;
    
    if (!certificates || certificates.length === 0) {
      return { 
        success: false, 
        error: new Error('No certificates found for this roster'),
        data: null 
      };
    }
    
    // Call the batch email service
    const certificateIds = certificates.map(cert => cert.id);
    
    const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
      body: {
        certificateIds,
        certificates,
        rosterId
      }
    });
    
    if (error) throw error;
    
    return { success: true, data, error: null };
  } catch (error) {
    console.error(`Error sending batch emails for roster:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error'),
      data: null 
    };
  }
};
