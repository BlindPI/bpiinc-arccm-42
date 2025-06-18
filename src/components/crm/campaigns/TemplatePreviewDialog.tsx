import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface TemplatePreviewDialogProps {
  template: {
    id: string;
    template_name: string;
    template_type: string;
    subject_line: string;
    content?: string;
    html_content?: string;
    variables?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({ template, open, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null;

  // Create a sample preview with placeholder data
  const sampleData = {
    first_name: 'John',
    last_name: 'Doe',
    company_name: 'ARCCM Training Institute',
    course_name: 'Professional Certification Course',
    start_date: 'March 15, 2024',
    location: 'Training Center',
    start_time: '9:00 AM'
  };

  // Replace variables in content with sample data
  const renderContent = (content: string) => {
    let rendered = content;
    template.variables?.forEach(variable => {
      const value = sampleData[variable as keyof typeof sampleData] || `{{${variable}}}`;
      rendered = rendered.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
    return rendered;
  };

  const previewSubject = renderContent(template.subject_line);
  const previewContent = template.html_content 
    ? renderContent(template.html_content)
    : renderContent(template.content || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Preview: {template.template_name}</DialogTitle>
          <DialogDescription>
            Preview of the email template with sample data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Template Type</Label>
              <p className="text-sm text-muted-foreground">{template.template_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Variables</Label>
              <p className="text-sm text-muted-foreground">
                {template.variables?.length ? template.variables.join(', ') : 'None'}
              </p>
            </div>
          </div>

          {/* Subject Line Preview */}
          <div>
            <Label className="text-sm font-medium">Subject Line</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
              <p className="font-medium">{previewSubject}</p>
            </div>
          </div>

          {/* Email Content Preview */}
          <div>
            <Label className="text-sm font-medium">Email Content</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              {template.html_content ? (
                <div 
                  className="p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <div className="p-4 bg-white max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {previewContent}
                </div>
              )}
            </div>
          </div>

          {/* Sample Data Used */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Label className="text-sm font-medium text-yellow-800">Sample Data Used in Preview</Label>
            <div className="mt-2 text-xs text-yellow-700 grid grid-cols-2 gap-2">
              {Object.entries(sampleData).map(([key, value]) => (
                <div key={key}>
                  <span className="font-mono">{`{{${key}}}:`}</span> {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}