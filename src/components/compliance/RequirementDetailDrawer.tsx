
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { FileUploadRequirement } from './FileUploadRequirement';
import { FormRequirement } from './FormRequirement';
import { ExternalLinkRequirement } from './ExternalLinkRequirement';
import { RequirementDetailDrawerProps, getStatusBadgeVariant } from './interfaces';
import { DatabaseAdapters } from '@/utils/database-adapters';

export function RequirementDetailDrawer({
  requirementId,
  isOpen,
  onClose,
  onUpdate
}: RequirementDetailDrawerProps) {
  const { user } = useAuth();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requirementId && isOpen) {
      loadRequirement();
    }
  }, [requirementId, isOpen]);

  const loadRequirement = async () => {
    if (!requirementId) return;
    
    setLoading(true);
    try {
      const data = await ComplianceRequirementsService.getRequirementById(requirementId);
      setRequirement(data);
    } catch (error) {
      console.error('Error loading requirement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!requirement || !requirementId || !user?.id) return;
    
    try {
      await ComplianceRequirementsService.updateRequirementStatus(
        requirementId, 
        'completed',
        user.id
      );
      
      onUpdate(requirementId);
      onClose();
    } catch (error) {
      console.error('Error saving requirement:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file.name);
    // Handle file upload logic
  };

  const handleSubmit = () => {
    handleSave();
  };

  if (!isOpen || !requirementId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px]">
        <SheetHeader>
          <SheetTitle>Requirement Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requirement ? (
          <div className="space-y-6 py-6">
            {/* Requirement Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{requirement.name}</h3>
                <Badge 
                  variant={getStatusBadgeVariant(requirement.current_status || 'pending')}
                >
                  {requirement.current_status || 'Pending'}
                </Badge>
              </div>
              {requirement.description && (
                <p className="text-sm text-muted-foreground">
                  {requirement.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Requirement Component */}
            <div className="space-y-4">
              {requirement.requirement_type === 'file_upload' && (
                <FileUploadRequirement
                  requirement={{
                    id: requirement.id,
                    name: requirement.name,
                    validation_rules: DatabaseAdapters.adaptValidationRules(requirement.validation_rules)
                  }}
                  onUpload={handleFileUpload}
                  onSave={handleSave}
                />
              )}

              {requirement.requirement_type === 'form' && user?.id && (
                <FormRequirement
                  requirement={{
                    id: requirement.id,
                    name: requirement.name,
                    form_fields: requirement.form_fields,
                    validation_rules: DatabaseAdapters.adaptValidationRules(requirement.validation_rules)
                  }}
                  userId={user.id}
                  onSave={handleSave}
                />
              )}

              {requirement.requirement_type === 'external_link' && (
                <ExternalLinkRequirement
                  requirement={{
                    id: requirement.id,
                    name: requirement.name,
                    description: requirement.description,
                    external_url: requirement.external_url,
                    external_system: requirement.external_system,
                    validation_rules: DatabaseAdapters.adaptValidationRules(requirement.validation_rules)
                  }}
                  onSubmit={handleSubmit}
                  onSave={handleSave}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Requirement not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
