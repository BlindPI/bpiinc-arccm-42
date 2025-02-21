
import React, { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function CertificateForm() {
  const [name, setName] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        fetch('https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/fonts//tahoma.ttf'),
        fetch('https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/fonts//Segoe%20UI.ttf')
      ]);

      if (!tahomaResponse.ok || !segoeResponse.ok) {
        throw new Error('Failed to fetch fonts');
      }

      const [tahomaArrayBuffer, segoeArrayBuffer] = await Promise.all([
        tahomaResponse.arrayBuffer(),
        segoeResponse.arrayBuffer()
      ]);

      const existingPdfBytes = await response.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Embed fonts
      const tahomaFont = await pdfDoc.embedFont(tahomaArrayBuffer);
      const segoeFont = await pdfDoc.embedFont(segoeArrayBuffer);

      const form = pdfDoc.getForm();

      // Validate form fields exist
      const requiredFields = ['NAME', 'COURSE', 'ISSUE', 'EXPIRY'];
      const missingFields = requiredFields.filter(fieldName => {
        try {
          form.getTextField(fieldName);
          return false;
        } catch (error) {
          return true;
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing form fields in PDF template: ${missingFields.join(', ')}`);
      }

      // Get form fields
      const nameField = form.getTextField('NAME');
      const courseField = form.getTextField('COURSE');
      const issueField = form.getTextField('ISSUE');
      const expiryField = form.getTextField('EXPIRY');

      // Update text fields with correct formatting
      // For NAME field - centered, large text
      nameField.setText(name);
      nameField.updateAppearances(tahomaFont);
      nameField.setFontSize(48);
      // Center alignment is handled in the PDF template

      // For COURSE field - centered, uppercase text
      courseField.setText(course.toUpperCase());
      courseField.updateAppearances(tahomaFont);
      courseField.setFontSize(28);
      // Center alignment is handled in the PDF template

      // For ISSUE field - left-aligned
      issueField.setText(issueDate);
      issueField.updateAppearances(segoeFont);
      issueField.setFontSize(20);
      // Left alignment is handled in the PDF template

      // For EXPIRY field - left-aligned
      expiryField.setText(expiryDate);
      expiryField.updateAppearances(segoeFont);
      expiryField.setFontSize(20);
      // Left alignment is handled in the PDF template

      // Flatten the form fields to make them non-editable
      form.flatten();

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();

      // Create a Blob and download the PDF
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
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
