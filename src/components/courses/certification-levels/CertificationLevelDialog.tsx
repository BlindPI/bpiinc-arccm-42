
import React from 'react';
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
import { CertificationLevel, CertificationLevelInput } from '@/types/certification-levels';
import { useCertificationLevelTypes } from '@/hooks/useCertificationLevelTypes';
import { PlusCircle } from 'lucide-react';

interface CertificationLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationLevelInput | (Partial<CertificationLevel> & { id: string })) => void;
  initialData?: CertificationLevel;
  type?: string;
}

export function CertificationLevelDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  type,
}: CertificationLevelDialogProps) {
  const [name, setName] = React.useState(initialData?.name || '');
  const [selectedType, setSelectedType] = React.useState(initialData?.type || type || '');
  const [newType, setNewType] = React.useState('');
  const [showNewTypeInput, setShowNewTypeInput] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; type?: string }>({});
  
  const { certificationTypes, isLoading: typesLoading, addCertificationType } = useCertificationLevelTypes();

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedType(initialData.type);
    } else if (type) {
      setSelectedType(type);
    }
    setShowNewTypeInput(false);
    setNewType('');
  }, [initialData, type, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { name?: string; type?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!selectedType && !newType) {
      newErrors.type = 'Type is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If using a new type, add it first
    if (newType.trim()) {
      addCertificationType.mutate(newType, {
        onSuccess: () => {
          if (initialData) {
            onSubmit({
              id: initialData.id,
              name,
              type: newType,
            });
          } else {
            onSubmit({
              name,
              type: newType,
              active: true,
            });
          }
          
          onOpenChange(false);
          resetForm();
        }
      });
    } else {
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
      
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    if (!initialData) {
      setName('');
      setSelectedType(type || '');
    }
    setShowNewTypeInput(false);
    setNewType('');
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
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
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            </div>
            
            {showNewTypeInput ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newType" className="text-right">
                  New Type
                </Label>
                <div className="col-span-3">
                  <div className="flex gap-2">
                    <Input
                      id="newType"
                      value={newType}
                      onChange={(e) => {
                        setNewType(e.target.value);
                        if (errors.type) setErrors({ ...errors, type: undefined });
                      }}
                      placeholder="Enter new type"
                      className={errors.type ? "border-red-500" : ""}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNewTypeInput(false);
                        setNewType('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>
            ) : (
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
                      disabled={!!initialData}
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
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Add Level'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
