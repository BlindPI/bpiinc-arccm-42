
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function CourseTypeDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Course type name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    const data = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      active: initialData?.active ?? true,
    };
    
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Course Type' : 'Add Course Type'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter course type name"
              required
              autoFocus
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
