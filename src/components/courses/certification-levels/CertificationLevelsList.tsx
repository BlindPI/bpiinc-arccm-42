
import React from 'react';
import { CourseTypeCertificationLevel } from '@/types/certification-levels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CertificationLevelsListProps {
  groupedRelationships: Record<string, CourseTypeCertificationLevel[]>;
  onRemoveAssociation: (id: string) => void;
  isRemoving: boolean;
  isLoading: boolean;
  courseTypeName: string;
}

export function CertificationLevelsList({
  groupedRelationships,
  onRemoveAssociation,
  isRemoving,
  isLoading,
  courseTypeName
}: CertificationLevelsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (Object.keys(groupedRelationships).length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>
          No certification levels are associated with this course type yet.
          Add certification levels to enable them for this course type.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">
        Certification Levels for {courseTypeName}
      </h3>
      
      {Object.entries(groupedRelationships).map(([type, typeLevels]) => (
        <div key={type} className="space-y-2">
          <h4 className="font-medium">{type}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeLevels.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>
                      {relationship.certification_level?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveAssociation(relationship.id)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
