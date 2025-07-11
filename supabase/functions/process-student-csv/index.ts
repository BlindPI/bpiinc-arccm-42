import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CSVRow {
  ID?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Amount spent'?: string;
  'Date created'?: string;
  Email?: string;
  Enrollments?: string;
  'Enrollments - list'?: string;
  'External source'?: string;
  'Last sign in'?: string;
  'Referred by'?: string;
  Roles?: string;
  'Sign in count'?: string;
  'Referred From'?: string;
  Country?: string;
  'Postal code'?: string;
  Region?: string;
}

interface ImportResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();

    if (!filePath) {
      throw new Error('File path is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Processing CSV file:', filePath);

    // Download the CSV file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('student-imports')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Parse CSV content
    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 CSV Headers:', headers);

    // Initialize result tracking
    const result: ImportResult = {
      total: lines.length - 1,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Create row object
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            row[header as keyof CSVRow] = values[index];
          }
        });

        // Skip empty rows
        if (!row.Email || row.Email.trim() === '') {
          result.processed++;
          continue;
        }

        // Prepare student data
        const email = row.Email.trim().toLowerCase();
        const firstName = row['First Name']?.trim() || '';
        const lastName = row['Last Name']?.trim() || '';
        const externalId = row.ID?.trim() || '';

        // Create metadata object with all additional CSV data
        const metadata = {
          amount_spent: row['Amount spent'] || '0',
          date_created: row['Date created'] || '',
          enrollments: parseInt(row.Enrollments || '0'),
          enrollments_list: row['Enrollments - list'] || '',
          external_source: row['External source'] || '',
          last_sign_in: row['Last sign in'] || '',
          referred_by: row['Referred by'] || '',
          roles: row.Roles || '',
          sign_in_count: parseInt(row['Sign in count'] || '0'),
          referred_from: row['Referred From'] || '',
          country: row.Country || '',
          postal_code: row['Postal code'] || '',
          region: row.Region || ''
        };

        // Use the database function to create or update student profile
        const { data, error } = await supabase.rpc('find_or_create_student_profile', {
          p_email: email,
          p_first_name: firstName || null,
          p_last_name: lastName || null,
          p_external_student_id: externalId || null,
          p_student_metadata: metadata
        });

        if (error) {
          console.error(`❌ Error processing row ${i}:`, error);
          result.errors.push(`Row ${i}: ${error.message}`);
          result.failed++;
        } else {
          console.log(`✅ Successfully processed: ${email}`);
          result.successful++;
        }

        result.processed++;

        // Add small delay to avoid overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

      } catch (rowError: any) {
        console.error(`❌ Error processing row ${i}:`, rowError);
        result.errors.push(`Row ${i}: ${rowError.message}`);
        result.failed++;
        result.processed++;
      }
    }

    // Clean up: delete the uploaded file
    try {
      await supabase.storage
        .from('student-imports')
        .remove([filePath]);
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup file:', cleanupError);
    }

    console.log('📊 Import completed:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ CSV processing failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        result: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          errors: [error.message]
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});