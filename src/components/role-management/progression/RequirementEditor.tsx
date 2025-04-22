
import React, { useState } from "react";
import { useRequirements } from "@/hooks/useRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2 as Trash, 
  MoveUp, 
  MoveDown, 
  FileText, 
  Clock, 
  ClipboardCheck, 
  Award 
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

// Constants for requirement types
const REQUIREMENT_TYPES = [
  { value: "document", label: "Document Upload", icon: <FileText className="w-4 h-4" /> },
  { value: "hours", label: "Hours Tracking", icon: <Clock className="w-4 h-4" /> },
  { value: "assessment", label: "Assessment", icon: <ClipboardCheck className="w-4 h-4" /> },
  { value: "certificate", label: "Certificate", icon: <Award className="w-4 h-4" /> }
];

interface RequirementEditorProps {
  progressionPathId: string;
  pathTitle?: string;
}

const RequirementForm: React.FC<{
  open: boolean;
  onClose: () => void;
  initial?: any;
  onSubmit: (data: any) => void;
  progressionPathId: string;
}> = ({ open, onClose, initial, onSubmit, progressionPathId }) => {
  const [formData, setFormData] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    requirementType: initial?.requirement_type ?? "document",
    isMandatory: initial?.is_mandatory ?? true,
    requiredCount: initial?.required_count ?? 1,
    metadata: initial?.metadata ?? {}
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        requirementType: initial?.requirement_type ?? "document",
        isMandatory: initial?.is_mandatory ?? true,
        requiredCount: initial?.required_count ?? 1,
        metadata: initial?.metadata ?? {}
      });
    }
  }, [open, initial]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const { title, description, requirementType, isMandatory, requiredCount, metadata } = formData;
    
    if (!title || !requirementType) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    const data = {
      id: initial?.id,
      title,
      description,
      requirement_type: requirementType,
      is_mandatory: isMandatory,
      required_count: requiredCount,
      progression_path_id: progressionPathId,
      metadata
    };
    
    onSubmit(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Requirement" : "Add Requirement"}
          </DialogTitle>
          <DialogDescription>
            {initial 
              ? "Modify this requirement for the progression path." 
              : "Add a new requirement to this progression path."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="requirementType">
              Requirement Type<span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.requirementType} 
              onValueChange={(value) => handleChange('requirementType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select requirement type" />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="title">
              Title<span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter requirement title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter requirement description"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="isMandatory" className="cursor-pointer flex items-center gap-2">
              Mandatory
              <span className="text-sm text-muted-foreground">(Required for completion)</span>
            </Label>
            <Switch
              id="isMandatory"
              checked={formData.isMandatory}
              onCheckedChange={(checked) => handleChange('isMandatory', checked)}
            />
          </div>
          
          <div>
            <Label htmlFor="requiredCount">Required Count</Label>
            <Input
              id="requiredCount"
              type="number"
              min={1}
              value={formData.requiredCount}
              onChange={(e) => handleChange('requiredCount', parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground mt-1">
              The number of items needed to fulfill this requirement
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initial ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const RequirementEditor: React.FC<RequirementEditorProps> = ({ 
  progressionPathId,
  pathTitle
}) => {
  const { 
    requirements, 
    loadingRequirements, 
    createRequirement, 
    updateRequirement, 
    deleteRequirement,
    updateRequirementsOrder
  } = useRequirements(progressionPathId);

  // Updated to properly destructure the useQuery result
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const userRole = profile?.role;

  // Only allow access to SA (System Admin) and AD (Admin)
  const canEdit = userRole === "SA" || userRole === "AD";
  
  // If profile is still loading, show nothing
  if (loadingProfile) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="animate-spin h-5 w-5" />
        Loading profile...
      </div>
    );
  }

  // If user is not admin, show access denied UI
  if (!canEdit) {
    return (
      <div className="p-4 border rounded text-center text-destructive/80">
        You do not have permission to edit progression requirements. Admin access required.
      </div>
    );
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleAdd() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(requirement: any) {
    setEditData(requirement);
    setFormOpen(true);
  }

  function handleSubmit(data: any) {
    if (data.id) {
      // For update, extract the id
      const { id, ...updates } = data;
      updateRequirement.mutate({ id, ...updates }, {
        onSuccess: () => {
          toast.success("Requirement updated successfully!");
        },
        onError: (err) => {
          toast.error(`Update failed: ${String(err)}`);
        }
      });
    } else {
      // For create
      createRequirement.mutate(data, {
        onSuccess: () => {
          toast.success("Requirement added successfully!");
        },
        onError: (err) => {
          toast.error(`Creation failed: ${String(err)}`);
        }
      });
    }
  }

  function handleDelete() {
    if (deleteConfirmId) {
      deleteRequirement.mutate(deleteConfirmId, {
        onSuccess: () => {
          toast.success("Requirement deleted successfully!");
          setDeleteConfirmId(null);
        },
        onError: (err) => {
          toast.error(`Deletion failed: ${String(err)}`);
        }
      });
    }
  }

  function moveRequirement(id: string, direction: 'up' | 'down') {
    if (!requirements || requirements.length <= 1) return;
    
    const reqIndex = requirements.findIndex(r => r.id === id);
    if (reqIndex === -1) return;
    
    // Can't move up if already at the top
    if (direction === 'up' && reqIndex === 0) return;
    
    // Can't move down if already at the bottom
    if (direction === 'down' && reqIndex === requirements.length - 1) return;
    
    // Create a copy of the requirements array
    const updatedRequirements = [...requirements];
    
    // Swap the requirements
    const targetIndex = direction === 'up' ? reqIndex - 1 : reqIndex + 1;
    [updatedRequirements[reqIndex], updatedRequirements[targetIndex]] = 
      [updatedRequirements[targetIndex], updatedRequirements[reqIndex]];
    
    // Update the sort order values
    const reorderedRequirements = updatedRequirements.map((req, index) => ({
      id: req.id,
      sort_order: index
    }));
    
    // Save the new order
    updateRequirementsOrder.mutate(reorderedRequirements, {
      onSuccess: () => {
        toast.success("Requirement order updated!");
      },
      onError: (err) => {
        toast.error(`Reordering failed: ${String(err)}`);
      }
    });
  }

  function getRequirementIcon(type: string) {
    const reqType = REQUIREMENT_TYPES.find(t => t.value === type);
    return reqType?.icon || <FileText className="w-4 h-4" />;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Requirements for {pathTitle || "Progression Path"}
        </h2>
        <Button 
          onClick={handleAdd} 
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Requirement
        </Button>
      </div>
      
      {loadingRequirements ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="animate-spin h-5 w-5" />
          Loading requirements...
        </div>
      ) : !requirements || requirements.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No requirements defined for this progression path.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Requirement
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <Card key={req.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-3 bg-muted/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getRequirementIcon(req.requirement_type)}
                    {req.title}
                    {req.is_mandatory && (
                      <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              
              {req.description && (
                <CardContent className="px-4 py-2 text-sm text-muted-foreground">
                  {req.description}
                </CardContent>
              )}
              
              <CardFooter className="px-4 py-2 justify-between bg-card border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => moveRequirement(req.id, 'up')}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={index === requirements.length - 1}
                      onClick={() => moveRequirement(req.id, 'down')}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm">
                    Require 
                    <span className="font-medium mx-1">{req.required_count || 1}</span> 
                    {req.required_count > 1 ? 'items' : 'item'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8"
                    onClick={() => handleEdit(req)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmId(req.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Form dialog */}
      <RequirementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editData}
        onSubmit={handleSubmit}
        progressionPathId={progressionPathId}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog 
        open={!!deleteConfirmId} 
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Requirement?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this requirement?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setDeleteConfirmId(null)}
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

export default RequirementEditor;
