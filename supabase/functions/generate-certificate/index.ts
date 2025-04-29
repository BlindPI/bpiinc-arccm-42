import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1'
import { format, parse } from 'https://esm.sh/date-fns@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Helper function to get template URL based on location
async function getTemplateForCertificate(locationId?: string): Promise<string> {
  console.log('Getting template for location:', locationId);
  
  // If locationId is provided, try to get location-specific template first
  if (locationId) {
    // Try to get primary template for location
    const { data: locationTemplate, error: locationError } = await supabaseAdmin
      .from('location_templates')
      .select('certificate_templates:template_id(url)')
      .eq('location_id', locationId)
      .eq('is_primary', true)
      .single();
    
    if (!locationError && locationTemplate?.certificate_templates?.url) {
      console.log('Using location-specific template:', locationTemplate.certificate_templates.url);
      return locationTemplate.certificate_templates.url;
    }
    console.log('No location-specific template found, falling back to default');
  }
  
  // Try to get default template
  const { data: defaultTemplate, error: defaultError } = await supabaseAdmin
    .from('certificate_templates')
    .select('url')
    .eq('is_default', true)
    .single();
  
  if (!defaultError && defaultTemplate?.url) {
    console.log('Using default template:', defaultTemplate.url);
    return defaultTemplate.url;
  }
  
  // Final fallback: get most recent template
  const { data: recentTemplate, error: recentError } = await supabaseAdmin
    .from('certificate_templates')
    .select('url')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (recentError || !recentTemplate?.url) {
    throw new Error('No certificate template available');
  }
  
  console.log('Using most recent template:', recentTemplate.url);
  return recentTemplate.url;
}

// Helper function to format dates properly
function formatDateString(dateStr: string): string {
  try {
    // Check if date is already in the correct format (Month day, year)
    if (dateStr.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
      console.log(`Date already properly formatted: ${dateStr}`);
      return dateStr;
    }
    
    // Try multiple date formats
    let parsedDate;
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'M/d/yyyy'];
    
    for (const fmt of formats) {
      try {
        parsedDate = parse(dateStr, fmt, new Date());
        if (!isNaN(parsedDate.getTime())) {
          break;
        }
      } catch (e) {
        // Try next format
      }
    }
    
    // If we couldn't parse with specific formats, try direct Date parsing
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = new Date(dateStr);
    }
    
    if (!isNaN(parsedDate.getTime())) {
      const formattedDate = format(parsedDate, 'MMMM d, yyyy');
      console.log(`Formatted date from ${dateStr} to ${formattedDate}`);
      return formattedDate;
    } else {
      console.error(`Could not parse date: ${dateStr}`);
      return dateStr; // Return original if we can't parse
    }
  } catch (error) {
    console.error(`Error formatting date ${dateStr}:`, error);
    return dateStr; // Return original on any error
  }
}

function generateVerificationCode() {
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

async function downloadFonts() {
  const fontFiles = {
    'Tahoma': 'tahoma.ttf',
    'TahomaBold': 'tahomabd.ttf',
    'SegoeUI': 'Segoe UI.ttf'
  };

  const embeddedFonts = {};
  
  for (const [fontKey, fontFile] of Object.entries(fontFiles)) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('fonts')
        .download(fontFile);
      
      if (error) throw error;
      
      embeddedFonts[fontKey] = await data.arrayBuffer();
      console.log(`Downloaded font: ${fontKey}`);
    } catch (err) {
      console.error(`Error downloading font ${fontKey}:`, err);
      throw new Error(`Failed to download font: ${fontKey}`);
    }
  }
  
  return embeddedFonts;
}

async function getDefaultTemplate() {
  // Try to get the default template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('is_default', true)
    .single();
  
  if (templateError) {
    // If no default template found, try to get the most recent one
    const { data: recentTemplate, error: recentError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (recentError || !recentTemplate) {
      throw new Error('No certificate template available');
    }
    
    return recentTemplate.url;
  }
  
  return template.url;
}

async function generatePDF(certificateData, templateUrl, fonts) {
  try {
    // Download template
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch template: ${templateResponse.status}`);
    }
    
    const templateBytes = await templateResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Register fontkit and embed fonts
    pdfDoc.registerFontkit(fontkit);
    
    const fieldConfigs = {
      NAME: { name: 'Tahoma', size: 48 },
      COURSE: { name: 'TahomaBold', size: 28 },
      ISSUE: { name: 'SegoeUI', size: 20 },
      EXPIRY: { name: 'SegoeUI', size: 20 }
    };
    
    const embeddedFonts = {};
    
    for (const [fontKey, fontData] of Object.entries(fonts)) {
      embeddedFonts[fontKey] = await pdfDoc.embedFont(fontData);
    }
    
    // Fill in form fields
    const form = pdfDoc.getForm();
    
    // Helper function to set field with font
    async function setField(fieldName, value, fontKey) {
      try {
        const textField = form.getTextField(fieldName);
        if (!textField) {
          throw new Error(`Field ${fieldName} not found in form`);
        }
        
        const font = embeddedFonts[fontKey];
        if (!font) {
          throw new Error(`Font ${fontKey} not found`);
        }
        
        textField.setText(value);
        textField.updateAppearances(font);
      } catch (error) {
        console.error(`Error setting field ${fieldName}:`, error);
        throw error;
      }
    }
    
    // Ensure dates are properly formatted before setting fields
    const formattedIssueDate = formatDateString(certificateData.issueDate);
    const formattedExpiryDate = formatDateString(certificateData.expiryDate);
    
    // Set fields with appropriate fonts
    await setField('NAME', certificateData.recipientName, 'Tahoma');
    await setField('COURSE', certificateData.courseName.toUpperCase(), 'TahomaBold');
    await setField('ISSUE', formattedIssueDate, 'SegoeUI');
    await setField('EXPIRY', formattedExpiryDate, 'SegoeUI');
    
    // Flatten form
    form.flatten();
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { requestId, issuerId } = await req.json();
    
    if (!requestId || !issuerId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Generating certificate for request ${requestId} by issuer ${issuerId}`);
    
    // 1. Get the certificate request data
    const { data: request, error: requestError } = await supabaseAdmin
      .from('certificate_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError || !request) {
      console.error('Certificate request not found:', requestError);
      return new Response(JSON.stringify({ error: 'Certificate request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Certificate request data:', request);
    
    // Format dates for certificate
    const formattedIssueDate = formatDateString(request.issue_date);
    const formattedExpiryDate = formatDateString(request.expiry_date);
    console.log(`Formatting dates: issue date ${request.issue_date} -> ${formattedIssueDate}, expiry date ${request.expiry_date} -> ${formattedExpiryDate}`);
    
    // 2. Generate verification code
    const verificationCode = generateVerificationCode();
    console.log('Generated verification code:', verificationCode);
    
    // 3. Insert certificate record
    // CRITICAL FIX: Set user_id to the request.user_id (original requester)
    const { data: certificate, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .insert({
        recipient_name: request.recipient_name,
        course_name: request.course_name,
        issue_date: formattedIssueDate,
        expiry_date: formattedExpiryDate,
        verification_code: verificationCode,
        issued_by: issuerId,
        certificate_request_id: requestId,
        location_id: request.location_id,
        status: 'ACTIVE',
        user_id: request.user_id // Important: Copy the original requester's ID
      })
      .select()
      .single();
    
    if (certificateError) {
      console.error('Failed to create certificate record:', certificateError);
      return new Response(JSON.stringify({ error: 'Failed to create certificate record', details: certificateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Created certificate record:', certificate);
    
    // 4. Log certificate creation
    try {
      await supabaseAdmin
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificate.id,
          action: 'CREATED',
          performed_by: issuerId
        });
      console.log('Logged certificate creation in audit logs');
    } catch (logError) {
      console.error('Error logging certificate creation:', logError);
      // Continue despite logging error
    }
    
    // 5. Get template URL based on location
    let templateUrl;
    try {
      templateUrl = await getTemplateForCertificate(request.location_id);
      console.log('Using template URL:', templateUrl);
    } catch (templateError) {
      console.error('Template error:', templateError);
      return new Response(JSON.stringify({ error: 'Failed to get template', details: templateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 6. Download fonts
    let fonts;
    try {
      fonts = await downloadFonts();
      console.log('Downloaded fonts successfully');
    } catch (fontError) {
      console.error('Font download error:', fontError);
      return new Response(JSON.stringify({ error: 'Failed to download fonts', details: fontError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 7. Generate PDF
    let pdfBytes;
    try {
      pdfBytes = await generatePDF(
        {
          recipientName: certificate.recipient_name,
          courseName: certificate.course_name,
          issueDate: certificate.issue_date,
          expiryDate: certificate.expiry_date
        },
        templateUrl,
        fonts
      );
      console.log('PDF generated successfully');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: pdfError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 8. Upload PDF to storage
    const pdfFileName = `certificate_${certificate.id}.pdf`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('certification-pdfs')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Failed to upload PDF:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload PDF', details: uploadError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('PDF uploaded successfully:', pdfFileName);
    
    // 9. Get the public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('certification-pdfs')
      .getPublicUrl(pdfFileName);
      
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for the PDF');
    } else {
      console.log('Public URL generated:', publicUrlData.publicUrl);
    }
    
    // 10. Update certificate with PDF URL
    const { error: updateError } = await supabaseAdmin
      .from('certificates')
      .update({
        certificate_url: publicUrlData?.publicUrl || pdfFileName
      })
      .eq('id', certificate.id);
    
    if (updateError) {
      console.error('Failed to update certificate with PDF URL:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update certificate with PDF URL', details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Certificate updated with PDF URL');
    
    // 11. CRITICAL FIX: Archive the certificate request instead of deleting it
    const { error: archiveError } = await supabaseAdmin
      .from('certificate_requests')
      .update({
        status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
      
    if (archiveError) {
      console.error('Failed to archive certificate request:', archiveError);
      // Don't fail the entire process if just the archiving fails
    } else {
      console.log('Approved request archived successfully');
    }
    
    // 12. Return success response with certificate data
    return new Response(JSON.stringify({ 
      success: true,
      certificate: {
        id: certificate.id,
        recipientName: certificate.recipient_name,
        courseName: certificate.course_name,
        verificationCode: certificate.verification_code,
        pdfUrl: publicUrlData?.publicUrl || pdfFileName
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Certificate generation failed', 
      message: error.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});