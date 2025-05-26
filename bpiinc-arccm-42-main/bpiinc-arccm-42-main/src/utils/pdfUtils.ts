
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { FontConfig, FONT_FILES } from '@/types/certificate';
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
    // Embed fonts from cache - no fallbacks
    for (const [fontKey, fontFile] of Object.entries(FONT_FILES)) {
      try {
        if (fontCache[fontFile]) {
          // Use the cached font
          embeddedFonts[fontKey] = await pdfDoc.embedFont(fontCache[fontFile]);
          console.log(`Successfully embedded font: ${fontKey}`);
        } else {
          // If font isn't available, throw an error
          throw new Error(`Required font ${fontKey} (${fontFile}) is not available.`);
        }
      } catch (err) {
        console.error(`Error embedding font ${fontKey}:`, err);
        throw new Error(`Failed to embed required font: ${fontKey}`);
      }
    }
    
    // Ensure all required fonts are available
    if (Object.keys(embeddedFonts).length !== Object.keys(FONT_FILES).length) {
      const missingFonts = Object.entries(FONT_FILES)
        .filter(([fontKey]) => !embeddedFonts[fontKey])
        .map(([fontKey, fontFile]) => `${fontKey} (${fontFile})`);
      
      throw new Error(`Missing required fonts: ${missingFonts.join(', ')}`);
    }
    
    return embeddedFonts;
  } catch (error) {
    console.error('Error in font embedding process:', error);
    throw error;
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

  // Determine which font to use based on the field configuration
  let fontKey = config.name;
  
  if (config.isBold && config.name === 'Tahoma') {
    fontKey = 'TahomaBold';
  } else if (config.name === 'Segoe UI') {
    fontKey = 'SegoeUI';
  }
  
  // Get the embedded font - no fallbacks
  const font = embeddedFonts[fontKey];
  
  if (!font) {
    throw new Error(`Required font not available for field ${fieldName}: ${fontKey}`);
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
  
  try {
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF template: ${response.status} ${response.statusText}`);
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
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
