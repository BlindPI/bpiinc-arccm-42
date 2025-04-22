import React, { useState } from "react";
import { useProgressionPaths } from "@/hooks/useProgressionPaths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2 as Trash, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { RequirementEditor } from "./RequirementEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ProgressionPathForm: React.FC<ProgressionPathFormProps> = ({ 
  open, 
  onClose, 
  initial, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    fromRole: initial?.from_role ?? "",
    toRole: initial?.to_role ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (open) {
      setFormData({
        fromRole: initial?.from_role ?? "",
        toRole: initial?.to_role ?? "",
        title: initial?.title ?? "",
        description: initial?.description ?? ""
      });
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { fromRole, toRole, title, description } = formData;
    
    if (!fromRole || !toRole || !title) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    onSubmit({
      from_role: fromRole,
      to_role: toRole,
      title,
      description,
      id: initial?.id,
    });
    
    onClose();
  }

  const DEFAULT_ROLES = ["IT", "IP", "IC", "AP", "AD", "SA"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Progression Path" : "Create Progression Path"}
          </DialogTitle>
          <DialogDescription>
            {initial 
              ? "Modify the details of this progression path." 
              : "Create a new progression path to define requirements for role transitions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              From Role<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded p-2 mt-1"
              value={formData.fromRole}
              onChange={e => handleChange('fromRole', e.target.value)}
              required
              disabled={!!initial?.id}
            >
              <option value="">Select...</option>
              {DEFAULT_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              To Role<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded p-2 mt-1"
              value={formData.toRole}
              onChange={e => handleChange('toRole', e.target.value)}
              required
              disabled={!!initial?.id}
            >
              <option value="">Select...</option>
              {DEFAULT_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Title<span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Give this path a title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <Input
              type="text"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Describe the path (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initial ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ProgressionPathBuilder: React.FC = () => {
  const { paths, loadingPaths, createPath, updatePath, deletePath } = useProgressionPaths();
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  function handleCreate() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(path: any) {
    setEditData(path);
    setFormOpen(true);
  }

  function handleFormSubmit(data: any) {
    console.log("Form submission data:", data);

    // Determine whether it's a create or update operation
    if (data.id) {
      // For update, we need to separate the id from the updates
      const { id, ...updates } = data;
      updatePath.mutate({ id, ...updates });
    } else {
      // For create, ensure we're not sending an id field at all
      const { id, ...createData } = data;
      createPath.mutate(createData, {
        onSuccess: () => {
          toast.success("Progression path created!");
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(`Creation failed: ${String(err)}`);
        }
      });
    }
  }

  function handleDeleteConfirm(id: string) {
    setDeleteId(id);
  }

  function handleDelete() {
    if (deleteId) {
      deletePath.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Progression path deleted!");
          setDeleteId(null);
          
          // If we deleted the expanded path, collapse it
          if (expandedPath === deleteId) {
            setExpandedPath(null);
          }
        },
        onError: (err) => toast.error(`Delete failed: ${String(err)}`)
      });
    }
  }

  function togglePathExpansion(pathId: string) {
    setExpandedPath(current => current === pathId ? null : pathId);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Progression Paths</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Path
        </Button>
      </div>
      
      {loadingPaths ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5" />
          Loading...
        </div>
      ) : (
        <div className="space-y-4">
          {paths && paths.length > 0 ? (
            <Accordion 
              type="single" 
              collapsible 
              value={expandedPath || undefined}
              className="space-y-4"
            >
              {paths.map((path: any) => (
                <AccordionItem 
                  key={path.id} 
                  value={path.id}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold text-lg">
                          {path.title} 
                          <span className="text-base text-gray-400 ml-2">
                            ({path.from_role} → {path.to_role})
                          </span>
                        </div>
                        {path.description && (
                          <div className="text-muted-foreground text-sm">
                            {path.description}
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion toggle
                        handleEdit(path);
                      }}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion toggle
                          handleDeleteConfirm(path.id);
                        }}
                      >
                        <Trash className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pt-2 pb-4">
                    <RequirementEditor 
                      progressionPathId={path.id} 
                      pathTitle={path.title}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              No progression paths found. Click "New Path" to add one.
            </div>
          )}
        </div>
      )}

      <ProgressionPathForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editData || undefined}
        onSubmit={handleFormSubmit}
      />

      {/* Confirmation dialog for deletion */}
      <Dialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Progression Path?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this progression path?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProgressionPathFormProps {
  open: boolean;
  onClose: () => void;
  initial?: {
    id?: string;
    from_role: string;
    to_role: string;
    title: string;
    description?: string;
  };
  onSubmit: (data: {
    from_role: string;
    to_role: string;
    title: string;
    description?: string;
    id?: string;
  }) => void;
}

export default ProgressionPathBuilder;
