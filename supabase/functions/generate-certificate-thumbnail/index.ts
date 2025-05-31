
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

async function downloadFonts(): Promise<FontCache> {
  const fontCache: FontCache = {};
  
  const fontUrls = {
    'Tahoma': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/fonts/tahoma.ttf',
    'TahomaBold': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/fonts/tahomabd.ttf',
    'SegoeUI': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/fonts/segoeui.ttf'
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
      
      if (textWidth > maxWidth) {
        fontSize = Math.floor((maxWidth / textWidth) * fontSize);
        console.log(`Auto-sizing font for "${value}": ${config.fontSize} -> ${fontSize}`);
      }
    }

    field.setText(value);
    field.setFontSize(fontSize);
    
    if (font && fontSize > 0) {
      field.updateAppearances(font);
    }
  } catch (error) {
    console.error(`Error setting field ${fieldName}:`, error);
    throw error;
  }
}

async function generateThumbnailFromPDF(templateUrl: string, certificateData: any, fontCache: FontCache): Promise<Uint8Array> {
  try {
    // Download template
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to download template: ${templateResponse.status}`);
    }
    
    const templateBytes = await templateResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Set form fields
    await setField(pdfDoc, form, 'NAME', certificateData.name, fontCache);
    await setField(pdfDoc, form, 'COURSE', certificateData.course, fontCache);
    await setField(pdfDoc, form, 'ISSUE', certificateData.issueDate, fontCache);
    await setField(pdfDoc, form, 'EXPIRY', certificateData.expiryDate, fontCache);
    
    // Flatten the form
    form.flatten();
    
    // Get the first page for thumbnail
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Create a new smaller PDF for thumbnail
    const thumbnailDoc = await PDFDocument.create();
    const [embeddedPage] = await thumbnailDoc.copyPages(pdfDoc, [0]);
    
    // Scale down the page for thumbnail (400x300 aspect ratio)
    const thumbnailWidth = 400;
    const thumbnailHeight = 300;
    const scaleFactor = Math.min(thumbnailWidth / width, thumbnailHeight / height);
    
    embeddedPage.scaleContent(scaleFactor, scaleFactor);
    const thumbnailPage = thumbnailDoc.addPage([thumbnailWidth, thumbnailHeight]);
    
    // Center the scaled content
    const xOffset = (thumbnailWidth - width * scaleFactor) / 2;
    const yOffset = (thumbnailHeight - height * scaleFactor) / 2;
    
    thumbnailPage.drawPage(embeddedPage, {
      x: xOffset,
      y: yOffset,
      width: width * scaleFactor,
      height: height * scaleFactor,
    });
    
    return await thumbnailDoc.save();
  } catch (error) {
    console.error('Thumbnail generation error:', error);
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

    const { certificateId } = await req.json();

    if (!certificateId) {
      throw new Error("Missing required parameter: certificateId");
    }

    console.log(`Generating thumbnail for certificate ${certificateId}`);

    // Check if thumbnail already exists
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    // If thumbnail already exists, return the URL
    if (certificate.thumbnail_url && certificate.thumbnail_status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          thumbnailUrl: certificate.thumbnail_url,
          cached: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as generating
    await supabase
      .from('certificates')
      .update({ thumbnail_status: 'generating' })
      .eq('id', certificateId);

    console.log('Certificate data:', certificate);

    // Download fonts
    const fontCache = await downloadFonts();

    // Get template
    const templateUrl = await getTemplate(supabase, certificate.location_id);
    console.log('Using template URL:', templateUrl);

    // Generate thumbnail PDF
    const thumbnailBytes = await generateThumbnailFromPDF(templateUrl, {
      name: certificate.recipient_name,
      course: certificate.course_name,
      issueDate: certificate.issue_date,
      expiryDate: certificate.expiry_date
    }, fontCache);

    // Upload thumbnail to storage
    const fileName = `thumbnail_${certificateId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('certificate-thumbnails')
      .upload(fileName, thumbnailBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error uploading thumbnail: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('certificate-thumbnails')
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL for thumbnail');
    }

    // Update certificate with thumbnail URL
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        thumbnail_url: publicUrlData.publicUrl,
        thumbnail_status: 'completed'
      })
      .eq('id', certificateId);

    if (updateError) {
      throw new Error(`Error updating certificate with thumbnail URL: ${updateError.message}`);
    }

    console.log('Thumbnail generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        thumbnailUrl: publicUrlData.publicUrl,
        cached: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in thumbnail generation:', error);
    
    // Mark thumbnail generation as failed
    if (error.certificateId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('certificates')
        .update({ thumbnail_status: 'failed' })
        .eq('id', error.certificateId);
    }
    
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
