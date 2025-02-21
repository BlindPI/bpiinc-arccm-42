
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

export function CertificateForm() {
  const [name, setName] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);

  useEffect(() => {
    verifyTemplateAvailability();
  }, []);

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

    for (const field of fields) {
      const fieldName = field.getName().toUpperCase();
      if (requiredFields.includes(fieldName)) {
        const textField = form.getTextField(field.getName());
        
        if (!textField || !textField.acroField) {
          throw new Error(`Field ${fieldName} is not properly configured`);
        }

        const da = textField.acroField.getDefaultAppearance();
        if (!da) {
          throw new Error(`Field ${fieldName} is missing default appearance settings`);
        }

        console.log(`Field ${fieldName} appearance:`, da);
      }
    }

    return true;
  };

  const preserveFieldAppearance = (textField: any) => {
    const acroField = textField.acroField;
    if (!acroField) return null;

    const appearance = acroField.getDefaultAppearance();
    console.log(`Preserving appearance: ${appearance}`);
    return {
      defaultAppearance: appearance
    };
  };

  const restoreFieldAppearance = (textField: any, appearance: any) => {
    if (!appearance || !textField.acroField) return;

    const acroField = textField.acroField;
    if (appearance.defaultAppearance) {
      console.log(`Restoring appearance: ${appearance.defaultAppearance}`);
      acroField.setDefaultAppearance(appearance.defaultAppearance);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTemplateAvailable) {
      toast.error('Certificate template is not available. Please contact support.');
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

      const form = pdfDoc.getForm();
      
      const fields = [
        { name: 'NAME', value: name },
        { name: 'COURSE', value: course.toUpperCase() },
        { name: 'ISSUE', value: issueDate },
        { name: 'EXPIRY', value: expiryDate }
      ];

      for (const field of fields) {
        const textField = form.getTextField(field.name);
        const originalAppearance = preserveFieldAppearance(textField);
        textField.setText(field.value);
        if (field.name === 'ISSUE' || field.name === 'EXPIRY') {
          textField.setAlignment(0);
        }
        restoreFieldAppearance(textField, originalAppearance);
      }

      // Flatten form fields to make them non-editable
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
