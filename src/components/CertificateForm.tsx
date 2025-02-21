
import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTemplateAvailable) {
      toast.error('Certificate template is not available. Please contact support.');
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch the PDF template
      const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF template');
      }

      // Fetch the fonts
      const [tahomaResponse, segoeResponse] = await Promise.all([
        fetch('https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/fonts/tahoma.ttf'),
        fetch('https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/fonts/Segoe%20UI.ttf')
      ]);

      if (!tahomaResponse.ok || !segoeResponse.ok) {
        throw new Error('Failed to fetch fonts');
      }

      const [tahomaArrayBuffer, segoeArrayBuffer] = await Promise.all([
        tahomaResponse.arrayBuffer(),
        segoeResponse.arrayBuffer()
      ]);

      const existingPdfBytes = await response.arrayBuffer();
      
      // Load the PDF document and register fontkit
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);

      // Embed fonts
      const tahomaFont = await pdfDoc.embedFont(tahomaArrayBuffer);
      const segoeFont = await pdfDoc.embedFont(segoeArrayBuffer);
      
      // Get the first page
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // Set correct font sizes as specified
      const nameSize = 48;      // 48pt for name
      const courseSize = 28;    // 28pt for course
      const dateSize = 20;      // 20pt for dates
      
      // Format dates
      const formattedIssueDate = formatDate(issueDate);
      const formattedExpiryDate = formatDate(expiryDate);

      // Name placement (centered, 48pt Tahoma)
      const nameWidth = tahomaFont.widthOfTextAtSize(name, nameSize);
      const nameX = (width - nameWidth) / 2;
      const nameY = height - 260; // Adjusted position

      // Course name placement (centered, 28pt Tahoma Bold)
      const courseText = course.toUpperCase();
      const courseWidth = tahomaFont.widthOfTextAtSize(courseText, courseSize);
      const courseX = (width - courseWidth) / 2;
      const courseY = height - 350; // Adjusted position

      // Draw text elements
      // Name (48pt Tahoma)
      page.drawText(name, {
        x: nameX,
        y: nameY,
        size: nameSize,
        font: tahomaFont,
        color: rgb(0, 0, 0)
      });

      // Course name (28pt Tahoma Bold)
      page.drawText(courseText, {
        x: courseX,
        y: courseY,
        size: courseSize,
        font: tahomaFont,
        color: rgb(0, 0, 0)
      });

      // Issue date (20pt Segoe UI)
      page.drawText(formattedIssueDate, {
        x: 130, // Adjusted position
        y: height - 450, // Adjusted position
        size: dateSize,
        font: segoeFont,
        color: rgb(0, 0, 0)
      });

      // Expiry date (20pt Segoe UI)
      const expiryWidth = segoeFont.widthOfTextAtSize(formattedExpiryDate, dateSize);
      page.drawText(formattedExpiryDate, {
        x: width - 130 - expiryWidth, // Adjusted position
        y: height - 450, // Aligned with issue date
        size: dateSize,
        font: segoeFont,
        color: rgb(0, 0, 0)
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();

      // Create a Blob and download
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
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              disabled={!isTemplateAvailable}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
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
