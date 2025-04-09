import React from 'react';
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
import { MapPin, Building, Map, CheckCircle, CircleX } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default("USA"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing && location) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(data)
          .eq('id', location.id);
        
        if (error) throw error;
        return { ...location, ...data };
      } else {
        // Create new location
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert(data)
          .select()
          .single();
        
        if (error) throw error;
        return newLocation;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(isEditing ? 'Location updated successfully' : 'Location added successfully');
      form.reset();
      if (onComplete) onComplete();
    },
    onError: (error) => {
      console.error('Error saving location:', error);
      toast.error(isEditing ? 'Failed to update location' : 'Failed to add location');
    },
  });

  function onSubmit(data: FormData) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      </form>
    </Form>
  );
}
