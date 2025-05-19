import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location, LocationInsert } from '@/types/courses';
import { MapPin, Building, Map, CheckCircle, CircleX, Mail, Phone, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationEmailTemplateManager } from './locations/LocationEmailTemplateManager';

// Import the standalone components if needed
// import { TemplateEditorDialog, DeleteTemplateDialog } from './locations/LocationEmailTemplateManager';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default("USA"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal(''))
});

type FormData = z.infer<typeof formSchema>;

export function LocationForm({ 
  location, 
  onComplete 
}: { 
  location?: Location | null;
  onComplete?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!location;
  const [activeTab, setActiveTab] = useState("details");
  const [tabsKey, setTabsKey] = useState(Date.now());

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
      if (isEditing && location) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(data as Location)
          .eq('id', location.id);
        
        if (error) throw error;
        return { ...location, ...data };
      } else {
        // Create new location
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert(data as Location)
          .select()
          .single();
        
        if (error) throw error;
        return newLocation;
      }
    },
    onSuccess: (savedLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(isEditing ? 'Location updated successfully' : 'Location added successfully');
      
      // If we're creating a new location, create a default email template
      if (!isEditing && savedLocation) {
        createDefaultTemplate(savedLocation.id);
      }
      
      form.reset();
      if (onComplete) onComplete();
    },
    onError: (error) => {
      console.error('Error saving location:', error);
      toast.error(isEditing ? 'Failed to update location' : 'Failed to add location');
    },
  });

  const createDefaultTemplate = async (locationId: string) => {
    try {
      await supabase
        .from('location_email_templates')
        .insert({
          location_id: locationId,
          name: 'Default Template',
          subject_template: 'Your {{course_name}} Certificate from {{location_name}}',
          body_template: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Certificate of Completion</h2>
            <p>Dear {{recipient_name}},</p>
            <p>Congratulations on successfully completing your {{course_name}} with {{location_name}}! Your official certificate is attached to this email for your records.</p>
            <p>This certification is valid until {{expiry_date}}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
            <p>Need additional training for yourself or your team? We offer regular courses in:</p>
            <ul>
              <li>Standard First Aid & CPR</li>
              <li>Emergency First Aid</li>
              <li>CPR/AED (Levels A, C, and BLS)</li>
              <li>Specialized workplace training</li>
            </ul>
            <p>Contact us for more information or to schedule training.</p>
            <p>Regards,</p>
            <p>{{location_name}}<br>
            {{#if location_phone}}Phone: {{location_phone}}<br>{{/if}}
            {{#if location_email}}Email: {{location_email}}<br>{{/if}}
            {{#if location_website}}Website: {{location_website}}{{/if}}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">This certificate is issued through {{location_name}} and is issued under Assured Response, WSIB authorized issuer.</p>
          </div>`,
          is_default: true
        });
    } catch (error) {
      console.error('Error creating default email template:', error);
    }
  };

  function onSubmit(data: FormData) {
    mutation.mutate(data);
  }

  // Force a remount of the tabs component when switching to email tab
  // This will ensure the LocationEmailTemplateManager is mounted fresh
  const handleTabChange = (value: string) => {
    if (value === "email" && activeTab !== "email") {
      // Force a remount of the tabs component
      setTimeout(() => {
        setTabsKey(Date.now());
      }, 0);
    }
    setActiveTab(value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {isEditing ? (
          <Tabs key={tabsKey} value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Location Details</TabsTrigger>
              <TabsTrigger value="email">Email Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              {/* Location Details Form */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Location Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="email" />
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
                        Contact Phone
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input {...field} value={field.value || ''} placeholder="https://" />
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
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="https://" />
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
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        City
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
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
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={mutation.isPending}
              >
                {mutation.isPending 
                  ? (isEditing ? 'Updating...' : 'Adding...') 
                  : (isEditing ? 'Update Location' : 'Add Location')
                }
              </Button>
            </TabsContent>
            
            <TabsContent value="email">
              {location && location.id && (
                <div id="email-template-container">
                  <LocationEmailTemplateManager 
                    locationId={location.id} 
                    locationName={location.name}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* For new location, show only the basic form */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Location Name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} type="email" />
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
                      Contact Phone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
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
                    <Input {...field} value={field.value || ''} placeholder="https://" />
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
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      City
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
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
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={mutation.isPending}
            >
              {mutation.isPending 
                ? 'Adding...' 
                : 'Add Location'
              }
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

// Make sure to export the component as default as well
export default LocationForm;