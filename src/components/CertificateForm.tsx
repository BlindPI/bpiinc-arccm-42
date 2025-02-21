
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Font configurations
interface FontConfig {
  name: string;
  size: number;
  isBold?: boolean;
}

const FIELD_CONFIGS: Record<string, FontConfig> = {
  NAME: { name: 'Tahoma', size: 48 },
  COURSE: { name: 'Tahoma', size: 28, isBold: true },
  ISSUE: { name: 'Segoe UI', size: 20 },
  EXPIRY: { name: 'Segoe UI', size: 20 }
} as const;

export function CertificateForm() {
  const [name, setName] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);
  const [fontCache, setFontCache] = useState<Record<string, ArrayBuffer>>({});

  useEffect(() => {
    verifyTemplateAvailability();
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      const fonts = ['Tahoma.ttf', 'TahomaBold.ttf', 'SegoeUI.ttf'];
      const loadedFonts: Record<string, ArrayBuffer> = {};

      for (const fontName of fonts) {
        const { data, error } = await supabase.storage
          .from('fonts')
          .download(fontName);

        if (error) {
          console.error(`Error loading font ${fontName}:`, error);
          toast.error(`Failed to load font ${fontName}`);
          continue;
        }

        loadedFonts[fontName] = await data.arrayBuffer();
      }

      setFontCache(loadedFonts);
      console.log('Fonts loaded successfully:', Object.keys(loadedFonts));
    } catch (error) {
      console.error('Error loading fonts:', error);
      toast.error('Failed to load required fonts');
    }
  };

  const verifyTemplateAvailability = async () => {
    try {
      const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
      const response = await fetch(templateUrl, { method: 'HEAD' });
      setIsTemplateAvailable(response.ok);
      
      if (!response.ok) {
        toast.error('Certificate template is not available. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying template:', error);
      setIsTemplateAvailable(false);
      toast.error('Unable to verify template availability');
    }
  };

  const validateTemplateFields = async (pdfDoc: PDFDocument) => {
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

  const embedFonts = async (pdfDoc: PDFDocument) => {
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

  const setFieldWithFont = async (
    form: any,
    fieldName: string,
    value: string,
    embeddedFonts: Record<string, any>
  ) => {
    const config = FIELD_CONFIGS[fieldName as keyof typeof FIELD_CONFIGS];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTemplateAvailable) {
      toast.error('Certificate template is not available. Please contact support.');
      return;
    }

    if (Object.keys(fontCache).length === 0) {
      toast.error('Required fonts are not loaded. Please try again.');
      return;
    }

    setIsGenerating(true);

    try {
      const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF template');
      }

      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      await validateTemplateFields(pdfDoc);
      const embeddedFonts = await embedFonts(pdfDoc);
      
      const form = pdfDoc.getForm();
      
      // Update fields with embedded fonts
      await setFieldWithFont(form, 'NAME', name, embeddedFonts);
      await setFieldWithFont(form, 'COURSE', course.toUpperCase(), embeddedFonts);
      await setFieldWithFont(form, 'ISSUE', issueDate, embeddedFonts);
      await setFieldWithFont(form, 'EXPIRY', expiryDate, embeddedFonts);

      // Flatten form fields to make them non-editable while preserving appearance
      form.flatten();

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `certificate-${name}.pdf`;
      link.click();

      toast.success('Certificate generated successfully');
    } catch (error) {
      console.error('Error generating certificate:', error);
      let errorMessage = 'Error generating certificate.';
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Generation Engine</CardTitle>
        <CardDescription>
          Fill in the details below to generate a new certificate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter recipient's name"
              disabled={!isTemplateAvailable}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
              placeholder="Enter course name"
              disabled={!isTemplateAvailable}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              placeholder="MM/DD/YYYY"
              disabled={!isTemplateAvailable}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              placeholder="MM/DD/YYYY"
              disabled={!isTemplateAvailable}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating || !isTemplateAvailable}
          >
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </Button>
          
          {!isTemplateAvailable && (
            <p className="text-red-500 text-sm text-center">
              Certificate template is currently unavailable. Please contact support.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
