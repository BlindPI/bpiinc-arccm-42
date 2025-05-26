
import React, { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  video: z.instanceof(FileList).refine((files) => files.length > 0, 'Video is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface VideoUploadFormProps {
  onUploadSuccess: (videoUrl: string) => void;
  onUploadError: (error: string) => void;
}

export function VideoUploadForm({ onUploadSuccess, onUploadError }: VideoUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit({ video }: FormValues) {
    if (video.length === 0) return;

    setUploading(true);
    const file = video[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Error uploading video');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="video"
          render={({ field: { onChange }, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>Upload Video</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => onChange(e.target.files)}
                  disabled={uploading}
                />
              </FormControl>
              {error && (
                <p className="text-sm text-red-500">{error.message}</p>
              )}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Video'
          )}
        </Button>
      </form>
    </Form>
  );
}
