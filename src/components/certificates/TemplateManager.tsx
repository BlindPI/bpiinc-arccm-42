import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Upload, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTemplateVersions, setDefaultTemplate, uploadTemplateVersion, TemplateVersion } from '@/services/certificates/templateService';
import { useAuth } from '@/contexts/AuthContext';
import { hasRequiredRole } from '@/utils/roleUtils';
import { UserRole } from '@/types/auth';
import { FontDiagnostics } from './FontDiagnostics';

export function TemplateManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateVersion, setTemplateVersion] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user && hasRequiredRole(user.role as UserRole, 'AD');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['certificate_templates'],
    queryFn: getTemplateVersions,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      return uploadTemplateVersion(selectedFile, templateName, templateVersion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate_templates'] });
      setSelectedFile(null);
      setTemplateName('');
      setTemplateVersion('');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (templateId: string) => setDefaultTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate_templates'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!templateVersion.trim()) {
      toast.error('Please enter a version');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    uploadMutation.mutate();
  };

  const handleSetDefault = (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to manage certificate templates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleUpload} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Certificate"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateVersion">Version</Label>
              <Input
                id="templateVersion"
                value={templateVersion}
                onChange={(e) => setTemplateVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="templateFile">PDF Template File</Label>
            <Input
              id="templateFile"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload a PDF with form fields: NAME, COURSE, ISSUE, EXPIRY
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Template'}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
      
      <FontDiagnostics />
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Template Versions</h3>
        {isLoading ? (
          <p className="text-muted-foreground">Loading templates...</p>
        ) : templates && templates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template: TemplateVersion) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.version}</TableCell>
                  <TableCell>
                    {format(new Date(template.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {template.is_default ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(template.id)}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(template.url, '_blank')}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">No templates uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
