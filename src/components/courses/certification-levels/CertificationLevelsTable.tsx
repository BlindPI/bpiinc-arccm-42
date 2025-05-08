
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCertificationLevels } from '@/hooks/useCertificationLevels';
import { CertificationLevelDialog } from './CertificationLevelDialog';
import { CertificationLevel } from '@/types/certification-levels';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilIcon, PowerIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface CertificationLevelsTableProps {
  type: string;
}

export function CertificationLevelsTable({ type }: CertificationLevelsTableProps) {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const {
    certificationLevels,
    isLoading,
    createCertificationLevel,
    updateCertificationLevel,
    toggleCertificationLevelStatus,
  } = useCertificationLevels(type as any); // Cast as any since type is a string, not limited to 'FIRST_AID' | 'CPR'

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingLevel, setEditingLevel] = React.useState<CertificationLevel | undefined>();

  const handleAddClick = () => {
    setEditingLevel(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (level: CertificationLevel) => {
    setEditingLevel(level);
    setDialogOpen(true);
  };

  const handleToggleStatus = (level: CertificationLevel) => {
    toggleCertificationLevelStatus.mutate({
      id: level.id,
      active: !level.active,
    });
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updateCertificationLevel.mutate(data);
    } else {
      createCertificationLevel.mutate(data);
    }
  };

  // Format the type for display in the UI
  const formatTypeForDisplay = (typeString: string) => {
    return typeString.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formattedType = formatTypeForDisplay(type);

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{formattedType}</CardTitle>
            <CardDescription>Manage {formattedType} certification levels available for courses</CardDescription>
          </div>
          <Button onClick={handleAddClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Level
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificationLevels.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No {formattedType.toLowerCase()} certification levels found. Add your first one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificationLevels.map((level) => (
                      <TableRow key={level.id}>
                        <TableCell className="font-medium">{level.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={level.active ? "default" : "outline"}
                            className={
                              level.active
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {level.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(level.updated_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(level)}
                            title="Edit Level"
                          >
                            <PencilIcon className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleStatus(level)}
                            title={level.active ? "Deactivate Level" : "Activate Level"}
                          >
                            <PowerIcon
                              className={`h-4 w-4 ${
                                level.active ? "text-green-500" : "text-red-500"
                              }`}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CertificationLevelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingLevel}
        type={type}
      />
    </>
  );
}
