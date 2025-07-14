import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { MapPin, Building, Map, CheckCircle, CircleX, Mail, Phone, Globe, Image, Settings } from 'lucide-react';
import type { Location } from '@/types/supabase-schema';
import { LocationEmailTemplateManager } from './LocationEmailTemplateManager';

const formSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default("USA"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal('')),
  logo_url: z.string().url("Invalid URL format").optional().or(z.literal(''))
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedLocationFormProps {
  location?: Location | null;
  onComplete?: () => void;
}

export function EnhancedLocationForm({ location, onComplete }: EnhancedLocationFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!location;
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: location?.name || "",
      address: location?.address || "",
      city: location?.city || "",
      state: location?.state || "",
      zip: location?.zip || "",
      country: location?.country || "USA",
      status: (location?.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
      email: location?.email || "",
      phone: location?.phone || "",
      website: location?.website || "",
      logo_url: location?.logo_url || ""
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Ensure required fields are present
      const locationData = {
        ...data,
        name: data.name, // required field
      };
      
      if (isEditing && location) {
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', location.id);
        
        if (error) throw error;
        return { ...location, ...locationData };
      } else {
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert(locationData)
          .select()
          .single();
        
        if (error) throw error;
        return newLocation;
      }
    },
    onSuccess: (savedLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(isEditing ? 'Location updated successfully' : 'Location created successfully');
      
      if (!isEditing && savedLocation) {
        createDefaultTemplate(savedLocation.id);
      }
      
      form.reset();
      onComplete?.();
    },
    onError: (error) => {
      console.error('Error saving location:', error);
      toast.error(isEditing ? 'Failed to update location' : 'Failed to create location');
    },
  });

  const createDefaultTemplate = async (locationId: string) => {
    try {
      await supabase
        .from('location_email_templates')
        .insert({
          location_id: locationId,
          name: 'Default Certificate Template',
          subject_template: 'Your {{course_name}} Certificate from {{location_name}}',
          body_template: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">Certificate of Completion</h2>
            <p>Dear {{recipient_name}},</p>
            <p>Congratulations on successfully completing your <strong>{{course_name}}</strong> training with {{location_name}}!</p>
            <p>Your official certificate is attached to this email for your records. This certification is valid until <strong>{{expiry_date}}</strong>.</p>
            
            <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1e40af;">Additional Training Available:</h3>
              <ul style="margin: 0;">
                <li>Standard First Aid & CPR</li>
                <li>Emergency First Aid</li>
                <li>CPR/AED (Levels A, C, and BLS)</li>
                <li>Workplace Safety Training</li>
              </ul>
            </div>
            
            <p>For more information or to schedule additional training, please contact us.</p>
            <p>Best regards,<br><strong>{{location_name}}</strong></p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              {{#if location_phone}}<p style="margin: 5px 0;"><strong>Phone:</strong> {{location_phone}}</p>{{/if}}
              {{#if location_email}}<p style="margin: 5px 0;"><strong>Email:</strong> {{location_email}}</p>{{/if}}
              {{#if location_website}}<p style="margin: 5px 0;"><strong>Website:</strong> {{location_website}}</p>{{/if}}
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center;">
              This certificate is issued by {{location_name}} under authorization from Assured Response Training.
            </p>
          </div>`,
          is_default: true
        });
      toast.success('Default email template created');
    } catch (error) {
      console.error('Error creating default template:', error);
    }
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEditing ? 'Edit Location' : 'Create New Location'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {isEditing 
            ? 'Update location details and manage email templates' 
            : 'Add a new training location to your organization'
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isEditing ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter location name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="123 Main Street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="City" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="ON" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="K1A 0A6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ACTIVE" className="flex items-center">
                                  <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Active
                                  </div>
                                </SelectItem>
                                <SelectItem value="INACTIVE">
                                  <div className="flex items-center">
                                    <CircleX className="h-4 w-4 mr-2 text-red-500" />
                                    Inactive
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} type="email" placeholder="contact@location.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="(555) 123-4567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="https://www.example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Logo URL
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="https://www.example.com/logo.png" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="email" className="space-y-6">
                {location?.id && (
                  <LocationEmailTemplateManager 
                    locationId={location.id} 
                    locationName={location.name}
                  />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter location name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} type="email" placeholder="contact@location.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="(555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="123 Main Street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="City" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="ON" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="K1A 0A6" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onComplete}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="min-w-32"
            >
              {mutation.isPending 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Location' : 'Create Location')
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}