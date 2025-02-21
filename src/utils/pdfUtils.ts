
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { FontConfig } from '@/types/certificate';
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
    if (fontCache['Tahoma.ttf']) {
      embeddedFonts['Tahoma'] = await pdfDoc.embedFont(fontCache['Tahoma.ttf']);
    }
    
    if (fontCache['TahomaBold.ttf']) {
      embeddedFonts['TahomaBold'] = await pdfDoc.embedFont(fontCache['TahomaBold.ttf']);
    }
    
    if (fontCache['SegoeUI.ttf']) {
      embeddedFonts['SegoeUI'] = await pdfDoc.embedFont(fontCache['SegoeUI.ttf']);
    }
    
    return embeddedFonts;
  } catch (error) {
    console.error('Error embedding fonts:', error);
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
  if (!config) return;

  const textField = form.getTextField(fieldName);
  const font = config.isBold ? embeddedFonts['TahomaBold'] : embeddedFonts[config.name.replace(' ', '')];
  
  if (!font) {
    console.error(`Font not found for field ${fieldName}`);
    throw new Error(`Required font not available for ${fieldName}`);
  }

  textField.setText(value);
  textField.updateAppearances(font);
};

export const generateCertificatePDF = async (
  templateUrl: string,
  data: { name: string; course: string; issueDate: string; expiryDate: string },
  fontCache: Record<string, ArrayBuffer>,
  fieldConfigs: Record<string, FontConfig>
) => {
  const response = await fetch(templateUrl);
  
  if (!response.ok) {
    throw new Error('Failed to fetch PDF template');
  }

  const existingPdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  await validateTemplateFields(pdfDoc);
  const embeddedFonts = await embedFonts(pdfDoc, fontCache);
  
  const form = pdfDoc.getForm();
  
  await setFieldWithFont(form, 'NAME', data.name, embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'COURSE', data.course.toUpperCase(), embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'ISSUE', data.issueDate, embeddedFonts, fieldConfigs);
  await setFieldWithFont(form, 'EXPIRY', data.expiryDate, embeddedFonts, fieldConfigs);

  form.flatten();

  return await pdfDoc.save();
};
