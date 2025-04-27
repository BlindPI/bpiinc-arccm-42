
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1'
import { format, parse } from 'https://esm.sh/date-fns@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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

async function getTemplateForLocation(locationId) {
  if (locationId) {
    // Try to get location-specific primary template
    const { data: locationTemplate, error: locationError } = await supabaseAdmin
      .from('location_templates')
      .select(`
        template_id,
        certificate_templates:template_id(url)
      `)
      .eq('location_id', locationId)
      .eq('is_primary', true)
      .maybeSingle();

    if (!locationError && locationTemplate && locationTemplate.certificate_templates) {
      console.log('Using location-specific primary template');
      return locationTemplate.certificate_templates.url;
    }
    
    // If no primary template, try any template for this location
    const { data: anyLocationTemplate, error: anyError } = await supabaseAdmin
      .from('location_templates')
      .select(`
        template_id,
        certificate_templates:template_id(url)
      `)
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!anyError && anyLocationTemplate && anyLocationTemplate.certificate_templates) {
      console.log('Using location-specific template (non-primary)');
      return anyLocationTemplate.certificate_templates.url;
    }
  }
  
  // Fall back to default template
  return await getDefaultTemplate();
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
      nameField: {
        x: 400,
        y: 400,
        maxWidth: 500,
        fontSize: 24,
        fontKey: 'TahomaBold',
        align: 'center'
      },
      courseField: {
        x: 400,
        y: 325,
        maxWidth: 500,
        fontSize: 18,
        fontKey: 'Tahoma',
        align: 'center'
      },
      dateFields: {
        x: 400,
        y: 250,
        maxWidth: 500,
        fontSize: 14,
        fontKey: 'Tahoma',
        align: 'center'
      }
    };
    
    // First page in the template
    const page = pdfDoc.getPages()[0];
    
    // Embed fonts
    const embeddedFonts = {};
    for (const [fontKey, fontBytes] of Object.entries(fonts)) {
      embeddedFonts[fontKey] = await pdfDoc.embedFont(fontBytes);
    }
    
    // Draw name field
    const nameConfig = fieldConfigs.nameField;
    const nameFont = embeddedFonts[nameConfig.fontKey];
    const nameWidth = nameFont.widthOfTextAtSize(certificateData.name, nameConfig.fontSize);
    const nameX = nameConfig.align === 'center' ? nameConfig.x - (nameWidth / 2) : nameConfig.x;
    
    page.drawText(certificateData.name, {
      x: nameX,
      y: nameConfig.y,
      size: nameConfig.fontSize,
      font: nameFont,
      maxWidth: nameConfig.maxWidth
    });
    
    // Draw course field
    const courseConfig = fieldConfigs.courseField;
    const courseFont = embeddedFonts[courseConfig.fontKey];
    const courseWidth = courseFont.widthOfTextAtSize(certificateData.course_name, courseConfig.fontSize);
    const courseX = courseConfig.align === 'center' ? courseConfig.x - (courseWidth / 2) : courseConfig.x;
    
    page.drawText(certificateData.course_name, {
      x: courseX,
      y: courseConfig.y,
      size: courseConfig.fontSize,
      font: courseFont,
      maxWidth: courseConfig.maxWidth
    });
    
    // Draw date fields
    const dateConfig = fieldConfigs.dateFields;
    const dateFont = embeddedFonts[dateConfig.fontKey];
    
    const issueDateText = `Issue Date: ${certificateData.issue_date}`;
    const issueDateWidth = dateFont.widthOfTextAtSize(issueDateText, dateConfig.fontSize);
    const issueDateX = dateConfig.align === 'center' ? dateConfig.x - (issueDateWidth / 2) : dateConfig.x;
    
    page.drawText(issueDateText, {
      x: issueDateX,
      y: dateConfig.y,
      size: dateConfig.fontSize,
      font: dateFont,
      maxWidth: dateConfig.maxWidth
    });
    
    const expiryDateText = `Expiry Date: ${certificateData.expiry_date}`;
    const expiryDateWidth = dateFont.widthOfTextAtSize(expiryDateText, dateConfig.fontSize);
    const expiryDateX = dateConfig.align === 'center' ? dateConfig.x - (expiryDateWidth / 2) : dateConfig.x;
    
    page.drawText(expiryDateText, {
      x: expiryDateX,
      y: dateConfig.y - 25,  // Offset from issue date
      size: dateConfig.fontSize,
      font: dateFont,
      maxWidth: dateConfig.maxWidth
    });
    
    // Generate and save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Handle OPTIONS preflight request
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Received certificate generation request');
    
    const requestData = await req.json();
    const { requestId, issuerId } = requestData;
    
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Processing certificate for request ID: ${requestId}`);
    
    // Get certificate request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from('certificate_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    
    if (requestError || !request) {
      console.error('Error fetching request:', requestError);
      return new Response(JSON.stringify({ error: 'Certificate request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Request data:', request);
    
    // Format dates
    const issueDate = formatDateString(request.issue_date);
    const expiryDate = formatDateString(request.expiry_date);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Create certificate record
    const { data: certificate, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .insert({
        certificate_request_id: requestId,
        issued_by: issuerId,
        verification_code: verificationCode,
        status: 'ACTIVE',
        issue_date: issueDate,
        expiry_date: expiryDate,
        course_name: request.course_name,
        recipient_name: request.recipient_name,
        location_id: request.location_id
      })
      .select()
      .single();
    
    if (certificateError) {
      console.error('Error creating certificate:', certificateError);
      return new Response(JSON.stringify({ error: 'Failed to create certificate record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Certificate created:', certificate.id);
    
    try {
      // Get fonts
      console.log('Downloading fonts...');
      const fonts = await downloadFonts();
      console.log('Fonts downloaded successfully');
      
      // Get template URL
      console.log('Getting template...');
      const templateUrl = await getTemplateForLocation(request.location_id);
      console.log('Using template URL:', templateUrl);
      
      // Generate PDF
      console.log('Generating PDF...');
      const pdfBytes = await generatePDF(
        { 
          name: request.recipient_name,
          course_name: request.course_name,
          issue_date: issueDate,
          expiry_date: expiryDate
        },
        templateUrl,
        fonts
      );
      console.log('PDF generated successfully');
      
      // Upload PDF to storage
      const fileName = `certificate_${certificate.id}.pdf`;
      console.log(`Uploading PDF as ${fileName}...`);
      const { error: uploadError } = await supabaseAdmin.storage
        .from('certification-pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);
      
      // Update certificate with URL
      await supabaseAdmin
        .from('certificates')
        .update({
          certificate_url: publicUrlData.publicUrl
        })
        .eq('id', certificate.id);
      
      console.log('Certificate PDF uploaded and URL updated');
      
      // Update request status
      await supabaseAdmin
        .from('certificate_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId);
      
      // Log certificate creation
      await supabaseAdmin
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificate.id,
          action: 'CREATED',
          performed_by: issuerId
        });
      
      return new Response(JSON.stringify({ 
        success: true,
        certificateId: certificate.id,
        certificateUrl: publicUrlData.publicUrl
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error in certificate generation process:', error);
      
      // Update certificate status to error
      await supabaseAdmin
        .from('certificates')
        .update({ status: 'ERROR' })
        .eq('id', certificate.id);
      
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
