
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { FontConfig, FONT_FILES, FALLBACK_FONTS } from '@/types/certificate';
import { toast } from 'sonner';

export const validateTemplateFields = async (pdfDoc: PDFDocument) => {
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  const requiredFields = ['NAME', 'COURSE', 'ISSUE', 'EXPIRY'];
  const missingFields = requiredFields.filter(fieldName => 
    !fields.some(field => field.getName().toUpperCase() === fieldName)
  );

  if (missingFields.length > 0) {
    throw new Error(`Template is missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
};

export const embedFonts = async (pdfDoc: PDFDocument, fontCache: Record<string, ArrayBuffer>) => {
  pdfDoc.registerFontkit(fontkit);
  
  const embeddedFonts: Record<string, any> = {};
  
  try {
    // First try to use custom fonts from the cache
    for (const [fontKey, fontFile] of Object.entries(FONT_FILES)) {
      try {
        if (fontCache[fontFile]) {
          // Use the cached font if available
          embeddedFonts[fontKey] = await pdfDoc.embedFont(fontCache[fontFile]);
          console.log(`Successfully embedded custom font: ${fontKey}`);
        } else {
          // Fall back to standard fonts
          const fallbackFont = FALLBACK_FONTS[fontKey as keyof typeof FALLBACK_FONTS] || StandardFonts.Helvetica;
          embeddedFonts[fontKey] = await pdfDoc.embedFont(fallbackFont);
          console.log(`Using fallback font for ${fontKey}: ${fallbackFont}`);
        }
      } catch (err) {
        console.warn(`Error embedding font ${fontKey}, using fallback:`, err);
        // If embedding fails, use a standard font
        const fallbackFont = FALLBACK_FONTS[fontKey as keyof typeof FALLBACK_FONTS] || StandardFonts.Helvetica;
        embeddedFonts[fontKey] = await pdfDoc.embedFont(fallbackFont);
      }
    }
    
    // Ensure we have at least basic font coverage for the certificate
    if (Object.keys(embeddedFonts).length === 0) {
      // Emergency fallback - use PDF standard fonts if nothing else works
      console.warn('No custom fonts could be embedded, using PDF standard fonts');
      embeddedFonts['Arial'] = await pdfDoc.embedFont(StandardFonts.Helvetica);
      embeddedFonts['ArialBold'] = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      embeddedFonts['Tahoma'] = await pdfDoc.embedFont(StandardFonts.Helvetica);
      embeddedFonts['TahomaBold'] = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      embeddedFonts['SegoeUI'] = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    return embeddedFonts;
  } catch (error) {
    console.error('Error in font embedding process:', error);
    throw new Error('Failed to embed required fonts');
  }
};

export const setFieldWithFont = async (
  form: any,
  fieldName: string,
  value: string,
  embeddedFonts: Record<string, any>,
  fieldConfigs: Record<string, FontConfig>
) => {
  const config = fieldConfigs[fieldName as keyof typeof fieldConfigs];
  if (!config) {
    throw new Error(`No configuration found for field ${fieldName}`);
  }

  const textField = form.getTextField(fieldName);
  if (!textField) {
    throw new Error(`Field ${fieldName} not found in form`);
  }

  // Determine which font to use
  let fontKey = config.isBold ? 'ArialBold' : 'Arial';
  
  // Try to use the configured font or a close match
  if (config.name === 'Tahoma') {
    fontKey = config.isBold ? 'TahomaBold' : 'Tahoma';
  } else if (config.name === 'Segoe UI' || config.name === 'SegoeUI') {
    fontKey = 'SegoeUI';
  }
  
  // Get the embedded font
  const font = embeddedFonts[fontKey] || embeddedFonts['Arial'] || Object.values(embeddedFonts)[0];
  
  if (!font) {
    throw new Error(`No suitable font available for ${fieldName}`);
  }

  try {
    textField.setText(value);
    textField.updateAppearances(font);
  } catch (error) {
    console.error(`Error setting field ${fieldName}:`, error);
    throw new Error(`Failed to set field ${fieldName}`);
  }
};

export const generateCertificatePDF = async (
  templateUrl: string,
  data: { name: string; course: string; issueDate: string; expiryDate: string },
  fontCache: Record<string, ArrayBuffer>,
  fieldConfigs: Record<string, FontConfig>
) => {
  console.log('Starting certificate PDF generation with template:', templateUrl);
  const response = await fetch(templateUrl);
  
  if (!response.ok) {
    throw new Error('Failed to fetch PDF template');
  }

  const existingPdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  await validateTemplateFields(pdfDoc);
  console.log('Template fields validated successfully');
  
  const embeddedFonts = await embedFonts(pdfDoc, fontCache);
  console.log('Fonts embedded successfully:', Object.keys(embeddedFonts));
  
  const form = pdfDoc.getForm();
  
  await setFieldWithFont(form, 'NAME', data.name, embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'COURSE', data.course.toUpperCase(), embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'ISSUE', data.issueDate, embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'EXPIRY', data.expiryDate, embeddedFonts, fieldConfigs);

  form.flatten();
  console.log('Certificate PDF generation completed successfully');

  return await pdfDoc.save();
};
