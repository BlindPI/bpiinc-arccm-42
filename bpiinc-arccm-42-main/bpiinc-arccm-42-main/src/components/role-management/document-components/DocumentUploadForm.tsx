
import React, { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  document: z.instanceof(FileList).refine((files) => files.length > 0, 'Document is required'),
});

type FormValues = z.infer<typeof formSchema>;

export interface DocumentUploadFormProps {
  onFileSelected: (file: File) => Promise<void>;
  isUploading: boolean;
  onCancel?: () => void;
  showModal?: boolean;
}

export function DocumentUploadForm({ 
  onFileSelected,
  isUploading,
  onCancel,
  showModal = false 
}: DocumentUploadFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = async (values: FormValues) => {
    if (values.document.length === 0) return;
    await onFileSelected(values.document[0]);
    form.reset();
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="document"
          render={({ field: { onChange }, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>Upload Document</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => onChange(e.target.files)}
                  disabled={isUploading}
                />
              </FormControl>
              {error && (
                <p className="text-sm text-red-500">{error.message}</p>
              )}
            </FormItem>
          )}
        />
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (showModal) {
    return (
      <Dialog open={showModal} onOpenChange={() => onCancel && onCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
