import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CertificationLevel, CertificationLevelInput } from '@/types/certification-levels';
import { useCertificationLevelTypes } from '@/hooks/useCertificationLevelTypes';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface CertificationLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationLevelInput | (Partial<CertificationLevel> & { id: string })) => void;
  initialData?: CertificationLevel;
  type?: string;
}

// Define form schema for new type validation
const newTypeSchema = z.object({
  newType: z.string().min(2, { message: 'Type name must be at least 2 characters' })
    .refine(val => /^[A-Z0-9_]+$/.test(val), {
      message: 'Type must contain only uppercase letters, numbers, and underscores'
    })
});

export function CertificationLevelDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  type,
}: CertificationLevelDialogProps) {
  const [name, setName] = React.useState(initialData?.name || '');
  const [selectedType, setSelectedType] = React.useState(initialData?.type || type || '');
  const [showNewTypeInput, setShowNewTypeInput] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; type?: string }>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const { certificationTypes, isLoading: typesLoading, addCertificationType } = useCertificationLevelTypes();

  // Setup form for new type
  const newTypeForm = useForm<z.infer<typeof newTypeSchema>>({
    resolver: zodResolver(newTypeSchema),
    defaultValues: {
      newType: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedType(initialData.type);
    } else if (type) {
      setSelectedType(type);
    }
    setShowNewTypeInput(false);
    newTypeForm.reset();
    setErrors({});
  }, [initialData, type, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsProcessing(true);
    
    // Validation
    const newErrors: { name?: string; type?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!selectedType && !showNewTypeInput) {
      newErrors.type = 'Type is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsProcessing(false);
      return;
    }

    try {
      // If we're using the existing selected type
      if (!showNewTypeInput) {
        if (initialData) {
          onSubmit({
            id: initialData.id,
            name,
            type: selectedType,
          });
        } else {
          onSubmit({
            name,
            type: selectedType,
            active: true,
          });
        }
      } 
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewType = newTypeForm.handleSubmit(async (data) => {
    setIsProcessing(true);
    
    try {
      // Check if type already exists
      if (certificationTypes.includes(data.newType)) {
        toast.error('This certification type already exists');
        setIsProcessing(false);
        return;
      }
      
      // Add the new type
      const result = await addCertificationType.mutateAsync(data.newType);
      
      if (result.success) {
        // Set it as selected type and hide the new type input
        setSelectedType(data.newType);
        setShowNewTypeInput(false);
        newTypeForm.reset();
      }
    } catch (error) {
      console.error('Error adding new type:', error);
      toast.error('Failed to add new certification type');
    } finally {
      setIsProcessing(false);
    }
  });

  const resetForm = () => {
    if (!initialData) {
      setName('');
      setSelectedType(type || '');
    }
    setShowNewTypeInput(false);
    newTypeForm.reset();
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Add'} Certification Level
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the details of this certification level.'
              : 'Create a new certification level for courses.'}
          </DialogDescription>
        </DialogHeader>
        
        {showNewTypeInput ? (
          <Form {...newTypeForm}>
            <form onSubmit={handleAddNewType} className="space-y-4">
              <FormField
                control={newTypeForm.control}
                name="newType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Certification Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., FIRST_AID, CPR, AED" 
                        {...field} 
                        className="uppercase"
                        autoFocus
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Use uppercase letters, numbers and underscores (e.g., FIRST_AID)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNewTypeInput(false);
                    newTypeForm.reset();
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Type
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={errors.name ? "border-red-500" : ""}
                    disabled={isProcessing}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <div className="flex gap-2">
                    <Select
                      value={selectedType}
                      onValueChange={(value) => {
                        setSelectedType(value);
                        if (errors.type) setErrors({ ...errors, type: undefined });
                      }}
                      disabled={!!initialData || isProcessing}
                    >
                      <SelectTrigger id="type" className="flex-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : certificationTypes.length === 0 ? (
                          <SelectItem value="none" disabled>No types available</SelectItem>
                        ) : (
                          certificationTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {!initialData && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowNewTypeInput(true)}
                        title="Add new type"
                        disabled={isProcessing}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>
            
            {certificationTypes.length === 0 && !showNewTypeInput && (
              <Alert className="mt-2 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">
                  No certification types exist yet. Add a new type first.
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing || (certificationTypes.length === 0 && !showNewTypeInput)}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  initialData ? 'Save Changes' : 'Add Level'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
