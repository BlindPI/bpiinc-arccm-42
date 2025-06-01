
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FontCache {
  [key: string]: Uint8Array;
}

const FIELD_CONFIGS = {
  NAME: { x: 325, y: 350, fontSize: 48, fontFamily: 'TahomaBold', color: [0, 0, 0] },
  COURSE: { x: 325, y: 280, fontSize: 24, fontFamily: 'Tahoma', color: [0, 0, 0] },
  ISSUE: { x: 325, y: 220, fontSize: 18, fontFamily: 'Tahoma', color: [0, 0, 0] },
  EXPIRY: { x: 500, y: 220, fontSize: 18, fontFamily: 'Tahoma', color: [0, 0, 0] }
};

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code = '';
  
  // Generate first 3 characters (letters)
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate middle 5 characters (numbers)
  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  // Generate last 2 characters (letters)
  for (let i = 0; i < 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

async function downloadFonts(): Promise<FontCache> {
  const fontCache: FontCache = {};
  
  const fontUrls = {
    'Tahoma': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts/tahoma.ttf',
    'TahomaBold': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts/tahomabd.ttf',
    'SegoeUI': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts/segoeui.ttf'
  };

  for (const [fontName, url] of Object.entries(fontUrls)) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        fontCache[fontName] = new Uint8Array(await response.arrayBuffer());
        console.log(`Downloaded font: ${fontName}`);
      }
    } catch (error) {
      console.error(`Failed to download font ${fontName}:`, error);
    }
  }
  
  console.log('Downloaded fonts successfully');
  return fontCache;
}

async function getTemplate(supabase: any, locationId?: string): Promise<string> {
  console.log('Getting template for location:', locationId);
  
  // If location is provided, try to get location-specific template
  if (locationId) {
    const { data: locationTemplate, error: locationError } = await supabase
      .from('location_templates')
      .select(`
        certificate_templates!inner(url)
      `)
      .eq('location_id', locationId)
      .eq('is_primary', true)
      .single();
      
    if (!locationError && locationTemplate) {
      const templateUrl = locationTemplate.certificate_templates.url;
      console.log('Using location-specific template:', templateUrl);
      return templateUrl;
    }
  }
  
  // Fallback to default template
  const { data: defaultTemplate, error: defaultError } = await supabase
    .from('certificate_templates')
    .select('url')
    .eq('is_default', true)
    .single();
    
  if (!defaultError && defaultTemplate) {
    console.log('Using default template:', defaultTemplate.url);
    return defaultTemplate.url;
  }
  
  // Final fallback to any template
  const { data: anyTemplate, error: anyError } = await supabase
    .from('certificate_templates')
    .select('url')
    .limit(1)
    .single();
    
  if (!anyError && anyTemplate) {
    console.log('Using fallback template:', anyTemplate.url);
    return anyTemplate.url;
  }
  
  throw new Error('No certificate template found');
}

function formatDate(dateStr: string): string {
  // Check if already in "Month day, year" format
  if (dateStr.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
    console.log(`Date already properly formatted: ${dateStr}`);
    return dateStr;
  }
  
  try {
    // Try parsing as YYYY-MM-DD
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dateParts[2]);
      
      const date = new Date(year, month, day);
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      console.log(`Formatted date from ${dateStr} to ${formattedDate}`);
      return formattedDate;
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  
  return dateStr; // Return original if formatting fails
}

async function setField(pdfDoc: PDFDocument, form: any, fieldName: string, value: string, fontCache: FontCache) {
  try {
    const field = form.getTextField(fieldName);
    const config = FIELD_CONFIGS[fieldName as keyof typeof FIELD_CONFIGS];
    
    if (!config) {
      console.warn(`No config found for field: ${fieldName}`);
      field.setText(value);
      return;
    }

    // Get font
    let font;
    if (config.fontFamily && fontCache[config.fontFamily]) {
      font = await pdfDoc.embedFont(fontCache[config.fontFamily]);
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    let fontSize = config.fontSize;
    const maxWidth = 649.9098; // Field width constraint

    // Auto-size font for name field if text is too wide
    if (fieldName === 'NAME') {
      const textWidth = font.widthOfTextAtSize(value, fontSize);
      console.log(`Auto-sizing font for "${value}": ${fontSize} -> `, textWidth, `(field width: ${maxWidth})`);
      
      if (textWidth > maxWidth) {
        fontSize = Math.floor((maxWidth / textWidth) * fontSize);
        console.log(`Auto-sizing font for "${value}": ${config.fontSize} -> ${fontSize} (width: ${font.widthOfTextAtSize(value, config.fontSize)} -> ${font.widthOfTextAtSize(value, fontSize)}, field width: ${maxWidth})`);
      }
    }

    field.setText(value);
    field.setFontSize(fontSize);
    
    // Only call updateAppearances if the font is valid
    if (font && fontSize > 0) {
      field.updateAppearances(font);
    }
  } catch (error) {
    console.error(`Error setting field ${fieldName}:`, error);
    throw error;
  }
}

async function generatePDF(templateUrl: string, certificateData: any, fontCache: FontCache): Promise<Uint8Array> {
  try {
    // Download template
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to download template: ${templateResponse.status}`);
    }
    
    const templateBytes = await templateResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // CRITICAL FIX: Register fontkit before any font operations
    pdfDoc.registerFontkit(fontkit);
    console.log('Fontkit registered successfully');
    
    const form = pdfDoc.getForm();
    
    // Set form fields - using the correct field names
    await setField(pdfDoc, form, 'NAME', certificateData.name, fontCache);
    await setField(pdfDoc, form, 'COURSE', certificateData.course, fontCache);
    await setField(pdfDoc, form, 'ISSUE', certificateData.issueDate, fontCache);
    await setField(pdfDoc, form, 'EXPIRY', certificateData.expiryDate, fontCache);
    
    // Flatten the form to make it non-editable
    form.flatten();
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, issuerId } = await req.json();

    if (!requestId || !issuerId) {
      throw new Error("Missing required parameters: requestId or issuerId");
    }

    console.log(`Generating certificate for request ${requestId} by issuer ${issuerId}`);

    // Get current attempt count and increment it properly
    const { data: currentRequest, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('generation_attempts')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching current request:', fetchError);
      throw fetchError;
    }

    const currentAttempts = currentRequest?.generation_attempts || 0;
    const newAttempts = currentAttempts + 1;

    // Update generation attempt counter and status
    const { error: updateAttemptError } = await supabase
      .from('certificate_requests')
      .update({
        generation_attempts: newAttempts,
        last_generation_attempt: new Date().toISOString(),
        status: 'PROCESSING'
      })
      .eq('id', requestId);

    if (updateAttemptError) {
      console.error('Error updating attempt counter:', updateAttemptError);
    }

    // Get certificate request
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Certificate request not found');
    }

    console.log('Certificate request data:', request);

    // Format dates
    const formattedIssueDate = formatDate(request.issue_date);
    const formattedExpiryDate = formatDate(request.expiry_date);
    
    console.log(`Formatting dates: issue date ${request.issue_date} -> ${formattedIssueDate}, expiry date ${request.expiry_date} -> ${formattedExpiryDate}`);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log('Generated verification code:', verificationCode);

    // Get roster information if available
    let rosterData = {};
    if (request.roster_id) {
      const { data: roster } = await supabase
        .from('rosters')
        .select('*')
        .eq('id', request.roster_id)
        .single();
      
      if (roster) {
        rosterData = {
          batch_id: roster.id,
          batch_name: roster.name,
          roster_id: roster.id
        };
        console.log('Creating certificate with roster data:', rosterData);
      }
    }

    // Create certificate record with PENDING generation status
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        recipient_name: request.recipient_name,
        course_name: request.course_name,
        issue_date: formattedIssueDate,
        expiry_date: formattedExpiryDate,
        verification_code: verificationCode,
        issued_by: issuerId,
        certificate_request_id: requestId,
        status: 'ACTIVE',
        location_id: request.location_id,
        user_id: issuerId,
        instructor_name: request.instructor_name,
        instructor_level: request.instructor_level,
        recipient_email: request.recipient_email,
        generation_status: 'PENDING',
        ...rosterData
      })
      .select()
      .single();

    if (certError) {
      console.error('Error creating certificate:', certError);
      throw certError;
    }

    console.log('Created certificate record:', certificate);

    // Log certificate creation
    try {
      await supabase
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificate.id,
          action: 'CREATED',
          performed_by: issuerId,
        });
      console.log('Logged certificate creation in audit logs');
    } catch (logError) {
      console.error('Error logging certificate creation:', logError);
    }

    try {
      // Get template
      const templateUrl = await getTemplate(supabase, request.location_id);
      console.log('Using template URL:', templateUrl);

      // Download fonts
      const fontCache = await downloadFonts();

      // Generate PDF
      const pdfBytes = await generatePDF(templateUrl, {
        name: request.recipient_name,
        course: request.course_name,
        issueDate: formattedIssueDate,
        expiryDate: formattedExpiryDate
      }, fontCache);

      // Upload PDF to storage
      const fileName = `certificate_${certificate.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certification-pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Error uploading PDF: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for certificate PDF');
      }

      // Update certificate with PDF URL and mark as completed
      const { error: updateError } = await supabase
        .from('certificates')
        .update({
          certificate_url: publicUrlData.publicUrl,
          generation_status: 'COMPLETED'
        })
        .eq('id', certificate.id);

      if (updateError) {
        throw new Error(`Error updating certificate with PDF URL: ${updateError.message}`);
      }

      // Archive the request only on complete success
      const { error: archiveError } = await supabase
        .from('certificate_requests')
        .update({
          status: 'ARCHIVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (archiveError) {
        console.error('Error archiving request:', archiveError);
      }

      console.log('Certificate generation completed successfully');

      return new Response(
        JSON.stringify({
          success: true,
          certificateId: certificate.id,
          certificateUrl: publicUrlData.publicUrl
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (generationError) {
      console.error('Error generating PDF:', generationError);
      
      // Mark certificate as failed
      await supabase
        .from('certificates')
        .update({ generation_status: 'FAILED' })
        .eq('id', certificate.id);

      // Mark request as generation failed with error details
      await supabase
        .from('certificate_requests')
        .update({
          status: 'GENERATION_FAILED',
          generation_error: generationError instanceof Error ? generationError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      throw generationError;
    }

  } catch (error) {
    console.error('Error in certificate generation:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
