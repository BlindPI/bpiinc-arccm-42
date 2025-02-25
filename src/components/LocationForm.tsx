
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LocationInsert } from '@/types/courses';

export function LocationForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationInsert>();

  const queryClient = useQueryClient();

  const createLocation = useMutation({
    mutationFn: async (data: LocationInsert) => {
      const { error } = await supabase
        .from('locations')
        .insert([{
          ...data,
          state: '',
          postal_code: '',
          country: ''
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location added successfully');
      reset();
    },
    onError: (error) => {
      console.error('Error adding location:', error);
      toast.error('Failed to add location');
    },
  });

  const onSubmit = (data: LocationInsert) => {
    createLocation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name', { required: true })}
            className={errors.name ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register('address', { required: true })}
            className={errors.address ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city', { required: true })}
            className={errors.city ? 'border-red-500' : ''}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createLocation.isPending}>
        {createLocation.isPending ? 'Adding...' : 'Add Location'}
      </Button>
    </form>
  );
}
