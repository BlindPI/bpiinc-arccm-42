
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

interface CertificationLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationLevelInput | (Partial<CertificationLevel> & { id: string })) => void;
  initialData?: CertificationLevel;
  type?: 'FIRST_AID' | 'CPR';
}

export function CertificationLevelDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  type,
}: CertificationLevelDialogProps) {
  const [name, setName] = React.useState(initialData?.name || '');
  const [selectedType, setSelectedType] = React.useState<'FIRST_AID' | 'CPR'>(
    initialData?.type || type || 'FIRST_AID'
  );
  const [errors, setErrors] = React.useState<{ name?: string }>({});

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedType(initialData.type);
    } else if (type) {
      setSelectedType(type);
    }
  }, [initialData, type, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
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
  };

  const resetForm = () => {
    if (!initialData) {
      setName('');
      setSelectedType(type || 'FIRST_AID');
    }
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedType}
                  onValueChange={(value: 'FIRST_AID' | 'CPR') => setSelectedType(value)}
                  disabled={!!initialData || !!type}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST_AID">First Aid</SelectItem>
                    <SelectItem value="CPR">CPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
