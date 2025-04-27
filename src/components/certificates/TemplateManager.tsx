import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FontDiagnostics } from './FontDiagnostics';
import { cn } from '@/lib/utils';

export function TemplateManager() {
  const [templateTab, setTemplateTab] = useState<string>("certificate");
  const [isUploading, setIsUploading] = useState(false);
  const [templateName, setTemplateName] = useState<string>('Standard Template');
  const [templateVersion, setTemplateVersion] = useState<string>('1.0');
  const queryClient = useQueryClient();

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['certificateTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleTemplateUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      setIsUploading(true);
      
      try {
        if (!file.type.includes('pdf')) {
          throw new Error('Only PDF files are supported for certificate templates');
        }

        const filePath = `templates/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificate-template')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('certificate-template')
          .getPublicUrl(filePath);
        
        if (!publicUrlData) throw new Error('Failed to get public URL');
        
        const { data: templateData, error: templateError } = await supabase
          .from('certificate_templates')
          .insert({
            name: templateName || 'Standard Template',
            version: templateVersion || '1.0',
            url: publicUrlData.publicUrl,
            is_default: !templates || templates.length === 0
          })
          .select()
          .single();
        
        if (templateError) throw templateError;
        
        toast.success('Certificate template uploaded successfully');
        queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      } catch (error) {
        console.error('Error uploading template:', error);
        toast.error(`Template upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  const setDefaultTemplate = async (templateId: string) => {
    try {
      const { error: resetError } = await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .neq('id', 'dummy');
      
      if (resetError) throw resetError;
      
      const { error: updateError } = await supabase
        .from('certificate_templates')
        .update({ is_default: true })
        .eq('id', templateId);
      
      if (updateError) throw updateError;
      
      toast.success('Default template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error(`Failed to set default template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Tabs value={templateTab} onValueChange={setTemplateTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 bg-gradient-to-r from-primary/90 to-primary p-1 rounded-lg shadow-md">
        <TabsTrigger 
          value="certificate" 
          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-white"
        >
          Certificate Templates
        </TabsTrigger>
        <TabsTrigger 
          value="fonts" 
          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-white"
        >
          Font Management
        </TabsTrigger>
      </TabsList>

      <TabsContent value="certificate" className="mt-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/80">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Certificate Templates
            </CardTitle>
            <CardDescription>
              Upload and manage certificate templates for PDF generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Standard Template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateVersion">Version</Label>
                <Input
                  id="templateVersion"
                  value={templateVersion}
                  onChange={(e) => setTemplateVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleTemplateUpload} 
              className="w-full flex items-center justify-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Template PDF
            </Button>
            
            <div className="border rounded-lg bg-gray-50/50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Available Templates</h3>
              {isLoadingTemplates ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Loading templates...</p>
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} 
                      className={cn(
                        "flex items-center justify-between text-sm p-3 border rounded-lg",
                        "bg-gradient-to-br from-white to-gray-50",
                        "hover:shadow-md transition-shadow"
                      )}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{template.name} v{template.version}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {template.is_default ? (
                          <span className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </span>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDefaultTemplate(template.id)}
                            className="hover:bg-primary/5"
                          >
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No templates uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fonts" className="mt-6">
        <FontDiagnostics />
      </TabsContent>
    </Tabs>
  );
}
