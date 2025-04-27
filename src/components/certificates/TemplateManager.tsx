
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, RefreshCw, FileText, MapPin, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FontDiagnostics } from './FontDiagnostics';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useLocationData } from '@/hooks/useLocationData';
import { 
  assignTemplateToLocation, 
  getLocationTemplates,
  removeTemplateFromLocation 
} from '@/services/certificates/locationTemplateService';
import { LocationTemplate } from '@/services/certificates/locationTemplateService';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function TemplateManager() {
  const [templateTab, setTemplateTab] = useState<string>("certificate");
  const [isUploading, setIsUploading] = useState(false);
  const [templateName, setTemplateName] = useState<string>('Standard Template');
  const [templateVersion, setTemplateVersion] = useState<string>('1.0');
  const queryClient = useQueryClient();

  // For location templates management
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const { locations, isLoading: isLoadingLocations } = useLocationData();

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

  const { data: locationTemplates, isLoading: isLoadingLocationTemplates } = useQuery({
    queryKey: ['locationTemplates'],
    queryFn: getLocationTemplates,
  });

  // Map to track which templates are assigned to which locations
  const locationTemplateMap = React.useMemo(() => {
    const map: Record<string, LocationTemplate[]> = {};
    
    if (locationTemplates) {
      locationTemplates.forEach(locTemp => {
        if (!map[locTemp.location_id]) {
          map[locTemp.location_id] = [];
        }
        map[locTemp.location_id].push(locTemp);
      });
    }
    
    return map;
  }, [locationTemplates]);

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

  const handleAssignTemplate = async () => {
    if (!selectedLocationId || !selectedTemplateId) {
      toast.error('Please select both a location and a template');
      return;
    }
    
    setIsAssigning(true);
    try {
      const result = await assignTemplateToLocation(selectedLocationId, selectedTemplateId, isPrimary);
      
      if (result) {
        toast.success('Template assigned to location successfully');
        // Reset form
        setSelectedLocationId('');
        setSelectedTemplateId('');
        setIsPrimary(false);
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['locationTemplates'] });
      } else {
        toast.error('Failed to assign template to location');
      }
    } catch (error) {
      console.error('Error assigning template:', error);
      toast.error(`Failed to assign template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveTemplateAssignment = async (locationId: string, templateId: string) => {
    try {
      const result = await removeTemplateFromLocation(locationId, templateId);
      
      if (result) {
        toast.success('Template removed from location');
        queryClient.invalidateQueries({ queryKey: ['locationTemplates'] });
      } else {
        toast.error('Failed to remove template from location');
      }
    } catch (error) {
      console.error('Error removing template assignment:', error);
      toast.error(`Failed to remove template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSetPrimaryTemplate = async (locationId: string, templateId: string) => {
    try {
      const result = await assignTemplateToLocation(locationId, templateId, true);
      
      if (result) {
        toast.success('Primary template updated');
        queryClient.invalidateQueries({ queryKey: ['locationTemplates'] });
      } else {
        toast.error('Failed to update primary template');
      }
    } catch (error) {
      console.error('Error setting primary template:', error);
      toast.error(`Failed to set primary template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Tabs value={templateTab} onValueChange={setTemplateTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3 bg-gradient-to-r from-primary/90 to-primary p-1 rounded-lg shadow-md">
        <TabsTrigger 
          value="certificate" 
          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-white"
        >
          Certificate Templates
        </TabsTrigger>
        <TabsTrigger 
          value="locations" 
          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-white"
        >
          Location Templates
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

      <TabsContent value="locations" className="mt-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/80">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Location Templates
            </CardTitle>
            <CardDescription>
              Assign templates to specific locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationSelect">Location</Label>
                <Select 
                  value={selectedLocationId} 
                  onValueChange={setSelectedLocationId}
                >
                  <SelectTrigger id="locationSelect">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateSelect">Template</Label>
                <Select 
                  value={selectedTemplateId} 
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger id="templateSelect">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} v{template.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={e => setIsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isPrimary" className="text-sm font-normal">
                  Set as primary template for this location
                </Label>
              </div>
            </div>
            
            <Button 
              onClick={handleAssignTemplate} 
              className="w-full flex items-center justify-center"
              disabled={isAssigning || !selectedLocationId || !selectedTemplateId}
            >
              {isAssigning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Assign Template to Location
            </Button>
            
            <div className="border rounded-lg bg-gray-50/50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Location Template Assignments</h3>
              
              {isLoadingLocationTemplates || isLoadingLocations ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Loading assignments...</p>
                </div>
              ) : locations && locations.length > 0 ? (
                <div className="space-y-6">
                  {locations.map(location => (
                    <div key={location.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-medium">{location.name}</h4>
                      </div>
                      
                      {locationTemplateMap[location.id] && locationTemplateMap[location.id].length > 0 ? (
                        <div className="pl-6 space-y-2">
                          {locationTemplateMap[location.id].map(locTemp => {
                            // Find the template details
                            const template = templates?.find(t => t.id === locTemp.template_id);
                            
                            if (!template) return null;
                            
                            return (
                              <div key={locTemp.id} className="flex items-center justify-between text-sm p-2 border rounded-lg bg-white">
                                <div className="flex items-center gap-2">
                                  <div>
                                    {template.name} v{template.version}
                                    {locTemp.is_primary && (
                                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!locTemp.is_primary && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleSetPrimaryTemplate(location.id, template.id)}
                                      className="text-xs h-7"
                                    >
                                      Set Primary
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveTemplateAssignment(location.id, template.id)}
                                    className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground pl-6">No templates assigned</p>
                      )}
                      
                      {location.id !== locations[locations.length - 1].id && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No locations available</p>
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
